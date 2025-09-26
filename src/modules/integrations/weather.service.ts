import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface WeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  precipitation: number;
  condition: string;
  impact: 'low' | 'medium' | 'high';
  recommendations: string[];
}

@Injectable()
export class WeatherService {
  constructor(private readonly httpService: HttpService) {}

  async getWeatherData(lat: number, lng: number): Promise<WeatherData> {
    try {
      // Mock weather data (in real implementation, use OpenWeatherMap API)
      const mockWeather = {
        temperature: 22 + Math.random() * 10,
        humidity: 60 + Math.random() * 30,
        windSpeed: Math.random() * 20,
        precipitation: Math.random() * 10,
        condition: this.getRandomCondition(),
      };

      const impact = this.calculateWeatherImpact(mockWeather);
      const recommendations = this.generateWeatherRecommendations(mockWeather, impact);

      return {
        ...mockWeather,
        impact,
        recommendations,
      };
    } catch (error) {
      // Fallback to default weather data
      return {
        temperature: 20,
        humidity: 50,
        windSpeed: 5,
        precipitation: 0,
        condition: '晴れ',
        impact: 'low',
        recommendations: ['通常の作業を継続'],
      };
    }
  }

  private getRandomCondition(): string {
    const conditions = ['晴れ', '曇り', '雨', '雪', '強風'];
    return conditions[Math.floor(Math.random() * conditions.length)];
  }

  private calculateWeatherImpact(weather: any): 'low' | 'medium' | 'high' {
    let impactScore = 0;

    if (weather.precipitation > 5) impactScore += 2;
    if (weather.windSpeed > 15) impactScore += 1;
    if (weather.temperature < 0 || weather.temperature > 35) impactScore += 1;
    if (weather.condition === '雪' || weather.condition === '強風') impactScore += 2;

    if (impactScore >= 3) return 'high';
    if (impactScore >= 1) return 'medium';
    return 'low';
  }

  private generateWeatherRecommendations(weather: any, impact: string): string[] {
    const recommendations = [];

    if (weather.precipitation > 5) {
      recommendations.push('雨天のため作業時間を調整');
    }
    if (weather.windSpeed > 15) {
      recommendations.push('強風のため安全対策を強化');
    }
    if (weather.temperature < 0) {
      recommendations.push('凍結注意のため路面状況を確認');
    }
    if (weather.temperature > 35) {
      recommendations.push('高温のため作業員の休憩を増やす');
    }
    if (impact === 'high') {
      recommendations.push('悪天候のため作業を延期することを検討');
    }

    if (recommendations.length === 0) {
      recommendations.push('天候良好、通常の作業を継続');
    }

    return recommendations;
  }

  async getWeatherForecast(lat: number, lng: number, days: number = 7): Promise<any[]> {
    // Mock forecast data
    const forecast = [];
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      
      forecast.push({
        date: date.toISOString().split('T')[0],
        temperature: {
          min: 15 + Math.random() * 10,
          max: 25 + Math.random() * 10,
        },
        condition: this.getRandomCondition(),
        precipitation: Math.random() * 15,
        windSpeed: Math.random() * 25,
      });
    }

    return forecast;
  }
}
