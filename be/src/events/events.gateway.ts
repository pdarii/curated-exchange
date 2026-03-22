import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    const traderId = client.handshake.query.traderId as string;
    if (traderId) {
      client.join(`trader_${traderId}`);
    }
  }

  handleDisconnect(client: Socket) {
  }

  @SubscribeMessage('ping')
  handlePing(client: Socket, data: any) {
    return { event: 'pong', data };
  }

  broadcast(event: string, data: any) {
    this.server.emit(event, data);
  }

  sendToTrader(traderId: string, event: string, data: any) {
    this.server.to(`trader_${traderId}`).emit(event, data);
  }
}
