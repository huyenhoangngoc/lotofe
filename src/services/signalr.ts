import { HubConnectionBuilder, HubConnection, LogLevel } from '@microsoft/signalr'

const SIGNALR_URL = import.meta.env.VITE_SIGNALR_URL || '/hubs/game'

let connection: HubConnection | null = null

export function getConnection(): HubConnection | null {
  return connection
}

export async function createConnection(): Promise<HubConnection> {
  if (connection) {
    await connection.stop()
  }

  connection = new HubConnectionBuilder()
    .withUrl(SIGNALR_URL)
    .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
    .configureLogging(LogLevel.Information)
    .build()

  return connection
}

export async function startConnection(): Promise<void> {
  if (!connection) return
  if (connection.state === 'Connected') return

  await connection.start()
}

export async function stopConnection(): Promise<void> {
  if (!connection) return
  await connection.stop()
  connection = null
}
