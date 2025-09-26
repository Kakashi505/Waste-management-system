import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { Tenant } from '../../database/entities/tenant.entity';

export interface SamlConfig {
  entityId: string;
  ssoUrl: string;
  sloUrl: string;
  certificate: string;
  privateKey?: string;
  nameIdFormat: string;
  attributeMapping: {
    email: string;
    firstName: string;
    lastName: string;
    groups: string;
  };
}

export interface SamlResponse {
  nameId: string;
  attributes: Record<string, any>;
  sessionIndex: string;
  issuer: string;
}

@Injectable()
export class SamlService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Tenant)
    private tenantRepository: Repository<Tenant>,
  ) {}

  async generateMetadata(config: SamlConfig): Promise<string> {
    // Generate SAML metadata XML
    const metadata = `<?xml version="1.0" encoding="UTF-8"?>
<md:EntityDescriptor xmlns:md="urn:oasis:names:tc:SAML:2.0:metadata" entityID="${config.entityId}">
  <md:SPSSODescriptor protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
    <md:AssertionConsumerService index="0" isDefault="true" Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="${config.ssoUrl}"/>
    <md:SingleLogoutService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect" Location="${config.sloUrl}"/>
    <md:NameIDFormat>${config.nameIdFormat}</md:NameIDFormat>
  </md:SPSSODescriptor>
</md:EntityDescriptor>`;

    return metadata;
  }

  async processSamlResponse(response: SamlResponse, tenantId: string): Promise<{
    user: User;
    isNewUser: boolean;
  }> {
    // Extract user information from SAML response
    const email = response.attributes.email || response.nameId;
    const firstName = response.attributes.firstName || '';
    const lastName = response.attributes.lastName || '';
    const groups = response.attributes.groups || [];

    // Find or create user
    let user = await this.userRepository.findOne({
      where: { email, tenantId },
    });

    const isNewUser = !user;

    if (!user) {
      user = this.userRepository.create({
        email,
        name: `${firstName} ${lastName}`.trim(),
        tenantId,
        isActive: true,
        role: this.determineUserRole(groups),
        metadata: {
          samlNameId: response.nameId,
          samlSessionIndex: response.sessionIndex,
          samlIssuer: response.issuer,
          samlGroups: groups,
        },
      });

      await this.userRepository.save(user);
    } else {
      // Update existing user
      user.name = `${firstName} ${lastName}`.trim();
      user.role = this.determineUserRole(groups);
      user.metadata = {
        ...user.metadata,
        samlNameId: response.nameId,
        samlSessionIndex: response.sessionIndex,
        samlIssuer: response.issuer,
        samlGroups: groups,
        lastSamlLogin: new Date().toISOString(),
      };

      await this.userRepository.save(user);
    }

    return { user, isNewUser };
  }

  async createSamlRequest(tenantId: string, returnUrl: string): Promise<{
    requestId: string;
    samlRequest: string;
    redirectUrl: string;
  }> {
    const tenant = await this.tenantRepository.findOne({
      where: { id: tenantId },
    });

    if (!tenant || !tenant.metadata?.samlConfig) {
      throw new Error('SAML設定が見つかりません');
    }

    const config = tenant.metadata.samlConfig as SamlConfig;
    const requestId = this.generateRequestId();

    // Create SAML AuthnRequest
    const samlRequest = this.createAuthnRequest(config, requestId, returnUrl);

    // Encode and create redirect URL
    const encodedRequest = Buffer.from(samlRequest).toString('base64');
    const redirectUrl = `${config.ssoUrl}?SAMLRequest=${encodedRequest}&RelayState=${encodeURIComponent(returnUrl)}`;

    return {
      requestId,
      samlRequest: encodedRequest,
      redirectUrl,
    };
  }

  async validateSamlResponse(response: string, tenantId: string): Promise<SamlResponse> {
    // In a real implementation, this would validate the SAML response signature
    // and parse the XML to extract the response data
    
    // Mock validation for demonstration
    const mockResponse: SamlResponse = {
      nameId: 'user@example.com',
      attributes: {
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
        groups: ['users', 'managers'],
      },
      sessionIndex: 'session_' + Date.now(),
      issuer: 'https://saml-provider.example.com',
    };

    return mockResponse;
  }

  private determineUserRole(groups: string[]): string {
    if (groups.includes('admins')) return 'admin';
    if (groups.includes('managers')) return 'manager';
    if (groups.includes('operators')) return 'operator';
    return 'user';
  }

  private generateRequestId(): string {
    return 'req_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  private createAuthnRequest(config: SamlConfig, requestId: string, returnUrl: string): string {
    // Create SAML AuthnRequest XML
    const authnRequest = `<?xml version="1.0" encoding="UTF-8"?>
<samlp:AuthnRequest xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
                    xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
                    ID="${requestId}"
                    Version="2.0"
                    IssueInstant="${new Date().toISOString()}"
                    Destination="${config.ssoUrl}"
                    AssertionConsumerServiceURL="${returnUrl}">
  <saml:Issuer>${config.entityId}</saml:Issuer>
  <samlp:NameIDPolicy Format="${config.nameIdFormat}" AllowCreate="true"/>
</samlp:AuthnRequest>`;

    return authnRequest;
  }
}
