# GCP Infrastructure for Waste Management System
terraform {
  required_version = ">= 1.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# VPC Network
resource "google_compute_network" "main" {
  name                    = "${var.project_name}-vpc"
  auto_create_subnetworks = false
  routing_mode            = "REGIONAL"
}

resource "google_compute_subnetwork" "public" {
  name          = "${var.project_name}-public-subnet"
  ip_cidr_range = "10.0.1.0/24"
  region        = var.region
  network       = google_compute_network.main.id
}

resource "google_compute_subnetwork" "private" {
  name          = "${var.project_name}-private-subnet"
  ip_cidr_range = "10.0.2.0/24"
  region        = var.region
  network       = google_compute_network.main.id
  
  private_ip_google_access = true
}

# Cloud SQL PostgreSQL
resource "google_sql_database_instance" "postgres" {
  name             = "${var.project_name}-postgres"
  database_version = "POSTGRES_15"
  region           = var.region

  settings {
    tier = var.db_tier
    
    disk_type = "PD_SSD"
    disk_size = var.db_disk_size
    
    backup_configuration {
      enabled                        = true
      start_time                     = "03:00"
      point_in_time_recovery_enabled = true
      transaction_log_retention_days = 7
      backup_retention_settings {
        retained_backups = 7
      }
    }
    
    ip_configuration {
      ipv4_enabled    = false
      private_network = google_compute_network.main.id
      require_ssl     = true
    }
    
    database_flags {
      name  = "log_statement"
      value = "all"
    }
    
    database_flags {
      name  = "log_min_duration_statement"
      value = "1000"
    }
  }

  deletion_protection = var.environment == "prod"
}

resource "google_sql_database" "main" {
  name     = var.db_name
  instance = google_sql_database_instance.postgres.name
}

resource "google_sql_user" "main" {
  name     = var.db_username
  instance = google_sql_database_instance.postgres.name
  password = var.db_password
}

# Memorystore Redis
resource "google_redis_instance" "main" {
  name           = "${var.project_name}-redis"
  tier           = var.redis_tier
  memory_size_gb = var.redis_memory_size
  
  region                 = var.region
  redis_version          = "REDIS_7_0"
  display_name           = "Waste Management Redis"
  
  authorized_network = google_compute_network.main.id
  
  redis_configs = {
    maxmemory-policy = "allkeys-lru"
  }
}

# Cloud Run Service
resource "google_cloud_run_v2_service" "app" {
  name     = "${var.project_name}-app"
  location = var.region

  template {
    containers {
      image = "gcr.io/${var.project_id}/${var.project_name}:latest"
      
      ports {
        container_port = 3000
      }
      
      env {
        name  = "NODE_ENV"
        value = "production"
      }
      
      env {
        name  = "DATABASE_URL"
        value = "postgresql://${var.db_username}:${var.db_password}@${google_sql_database_instance.postgres.private_ip_address}:5432/${var.db_name}"
      }
      
      env {
        name  = "REDIS_URL"
        value = "redis://${google_redis_instance.main.host}:${google_redis_instance.main.port}"
      }
      
      resources {
        limits = {
          cpu    = "2"
          memory = "4Gi"
        }
      }
    }
    
    scaling {
      min_instance_count = var.min_instances
      max_instance_count = var.max_instances
    }
    
    vpc_access {
      connector = google_vpc_access_connector.main.id
      egress    = "PRIVATE_RANGES_ONLY"
    }
  }

  traffic {
    percent = 100
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
  }
}

# VPC Access Connector
resource "google_vpc_access_connector" "main" {
  name          = "${var.project_name}-connector"
  ip_cidr_range = "10.8.0.0/28"
  network       = google_compute_network.main.name
  region        = var.region
}

# Cloud Storage Bucket
resource "google_storage_bucket" "storage" {
  name          = "${var.project_name}-storage-${random_string.bucket_suffix.result}"
  location      = var.region
  force_destroy = var.environment != "prod"

  uniform_bucket_level_access = true

  versioning {
    enabled = true
  }

  encryption {
    default_kms_key_name = google_kms_crypto_key.storage.id
  }

  lifecycle_rule {
    condition {
      age = 30
    }
    action {
      type = "Delete"
    }
  }
}

# KMS Key
resource "google_kms_key_ring" "main" {
  name     = "${var.project_name}-keyring"
  location = var.region
}

resource "google_kms_crypto_key" "storage" {
  name            = "${var.project_name}-storage-key"
  key_ring        = google_kms_key_ring.main.id
  rotation_period = "7776000s" # 90 days
}

# Cloud Load Balancer
resource "google_compute_global_address" "main" {
  name = "${var.project_name}-ip"
}

resource "google_compute_url_map" "main" {
  name            = "${var.project_name}-url-map"
  default_service = google_compute_backend_service.app.id
}

resource "google_compute_backend_service" "app" {
  name        = "${var.project_name}-backend"
  protocol    = "HTTP"
  port_name   = "http"
  timeout_sec = 30

  backend {
    group = google_cloud_run_v2_service.app.template[0].containers[0].name
  }

  health_checks = [google_compute_health_check.app.id]
}

resource "google_compute_health_check" "app" {
  name               = "${var.project_name}-health-check"
  check_interval_sec = 5
  timeout_sec        = 5
  healthy_threshold  = 2
  unhealthy_threshold = 3

  http_health_check {
    request_path = "/api/health"
    port         = "3000"
  }
}

resource "google_compute_target_https_proxy" "main" {
  name             = "${var.project_name}-https-proxy"
  url_map          = google_compute_url_map.main.id
  ssl_certificates = [google_compute_managed_ssl_certificate.main.id]
}

resource "google_compute_managed_ssl_certificate" "main" {
  name = "${var.project_name}-ssl-cert"

  managed {
    domains = [var.domain_name]
  }
}

resource "google_compute_global_forwarding_rule" "main" {
  name       = "${var.project_name}-forwarding-rule"
  target     = google_compute_target_https_proxy.main.id
  port_range = "443"
  ip_address = google_compute_global_address.main.address
}

# Cloud Logging
resource "google_logging_project_sink" "app" {
  name        = "${var.project_name}-app-logs"
  destination = "storage.googleapis.com/${google_storage_bucket.logs.name}"

  filter = "resource.type=\"cloud_run_revision\" AND resource.labels.service_name=\"${var.project_name}-app\""
}

resource "google_storage_bucket" "logs" {
  name          = "${var.project_name}-logs-${random_string.bucket_suffix.result}"
  location      = var.region
  force_destroy = true
}

# Monitoring
resource "google_monitoring_alert_policy" "app_error_rate" {
  display_name = "High Error Rate"
  combiner     = "OR"
  conditions {
    display_name = "Error rate too high"
    condition_threshold {
      filter          = "resource.type=\"cloud_run_revision\" AND resource.labels.service_name=\"${var.project_name}-app\""
      duration        = "300s"
      comparison      = "COMPARISON_GREATER_THAN"
      threshold_value = 0.05

      aggregations {
        alignment_period   = "60s"
        per_series_aligner = "ALIGN_RATE"
        cross_series_reducer = "REDUCE_MEAN"
        group_by_fields = ["resource.label.service_name"]
      }
    }
  }

  notification_channels = [google_monitoring_notification_channel.email.id]
}

resource "google_monitoring_notification_channel" "email" {
  display_name = "Email Notification"
  type         = "email"
  labels = {
    email_address = var.alert_email
  }
}

# Firewall Rules
resource "google_compute_firewall" "allow_https" {
  name    = "${var.project_name}-allow-https"
  network = google_compute_network.main.name

  allow {
    protocol = "tcp"
    ports    = ["443"]
  }

  source_ranges = ["0.0.0.0/0"]
  target_tags   = ["https-server"]
}

resource "google_compute_firewall" "allow_http" {
  name    = "${var.project_name}-allow-http"
  network = google_compute_network.main.name

  allow {
    protocol = "tcp"
    ports    = ["80"]
  }

  source_ranges = ["0.0.0.0/0"]
  target_tags   = ["http-server"]
}

# Random string for bucket suffix
resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

# Variables
variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "region" {
  description = "GCP Region"
  type        = string
  default     = "asia-northeast1"
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "waste-management"
}

variable "environment" {
  description = "Environment"
  type        = string
  default     = "prod"
}

variable "db_tier" {
  description = "Cloud SQL tier"
  type        = string
  default     = "db-f1-micro"
}

variable "db_disk_size" {
  description = "Database disk size"
  type        = number
  default     = 20
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "waste_management"
}

variable "db_username" {
  description = "Database username"
  type        = string
  default     = "postgres"
}

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

variable "redis_tier" {
  description = "Redis tier"
  type        = string
  default     = "BASIC"
}

variable "redis_memory_size" {
  description = "Redis memory size"
  type        = number
  default     = 1
}

variable "min_instances" {
  description = "Minimum Cloud Run instances"
  type        = number
  default     = 1
}

variable "max_instances" {
  description = "Maximum Cloud Run instances"
  type        = number
  default     = 10
}

variable "domain_name" {
  description = "Domain name"
  type        = string
}

variable "alert_email" {
  description = "Alert email address"
  type        = string
}

# Outputs
output "database_connection_name" {
  value = google_sql_database_instance.postgres.connection_name
}

output "redis_host" {
  value = google_redis_instance.main.host
}

output "load_balancer_ip" {
  value = google_compute_global_address.main.address
}

output "storage_bucket_name" {
  value = google_storage_bucket.storage.name
}
