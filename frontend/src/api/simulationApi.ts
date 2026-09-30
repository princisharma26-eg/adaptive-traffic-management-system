import type { LiveStats, SignalPhaseInfo, SimulationConfig } from '../types/traffic';

const BASE_URL = '/api';

export interface BackendStatus {
  isOnline: boolean;
  lastChecked: number;
}

export class SimulationApiClient {
  /**
   * Fetches intersection configuration from backend
   */
  public static async fetchConfig(): Promise<SimulationConfig | null> {
    try {
      const response = await fetch(`${BASE_URL}/simulation/config`);
      if (!response.ok) return null;
      return await response.json();
    } catch {
      return null;
    }
  }

  /**
   * Updates intersection configuration on backend (mode, green limits, rates)
   */
  public static async updateConfig(config: SimulationConfig): Promise<SimulationConfig | null> {
    try {
      const response = await fetch(`${BASE_URL}/simulation/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (!response.ok) return null;
      return await response.json();
    } catch {
      return null;
    }
  }

  /**
   * Sends control commands (START, PAUSE, RESET, SET_SPEED)
   */
  public static async sendControl(
    action: 'START' | 'PAUSE' | 'RESET' | 'SET_SPEED',
    speedMultiplier?: number
  ): Promise<boolean> {
    try {
      const response = await fetch(`${BASE_URL}/simulation/control`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, speedMultiplier }),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Synchronizes authoritative signal states from backend algorithm
   */
  public static async fetchSignals(elapsedSeconds: number): Promise<SignalPhaseInfo | null> {
    try {
      const response = await fetch(
        `${BASE_URL}/simulation/signals?elapsedSeconds=${elapsedSeconds.toFixed(1)}`
      );
      if (!response.ok) return null;
      return await response.json();
    } catch {
      return null;
    }
  }

  /**
   * Ingests real simulation telemetry into the backend
   */
  public static async sendTelemetry(stats: LiveStats): Promise<boolean> {
    try {
      const response = await fetch(`${BASE_URL}/simulation/telemetry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stats),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Retrieves server-computed live analytics
   */
  public static async fetchLiveAnalytics(): Promise<any | null> {
    try {
      const response = await fetch(`${BASE_URL}/analytics/live`);
      if (!response.ok) return null;
      return await response.json();
    } catch {
      return null;
    }
  }
}
