import EventEmitter from 'events';

import grpc from 'grpc';
import { Empty } from 'google-protobuf/google/protobuf/empty_pb';

import { IChatServer, ChatService } from './protos/chat_grpc_pb';
import { GetMessagesReply, Message } from './protos/chat_pb';

const entrypoint = '0.0.0.0:50051';

class Chat implements IChatServer {
    private emitter = new EventEmitter();
    private messages: Message[] = [];

    getMessages(_call: grpc.ServerUnaryCall<Empty>, callback: grpc.sendUnaryData<GetMessagesReply>) {
        const reply = new GetMessagesReply();

        reply.setItemsList(this.messages);

        callback(null, reply);
    }

    sendMessage({ request }: grpc.ServerUnaryCall<Message>, callback: grpc.sendUnaryData<Empty>) {
        this.messages.push(request);

        this.emitter.emit('new-message', request);

        callback(null, new Empty());
    }

    streamMessages(call: grpc.ServerWriteableStream<Empty>) {
        this.emitter.on('new-message', (message: Message) => {
            call.write(message);
        });
    }
}

function main() {
    const server = new grpc.Server();

    server.addService(ChatService, new Chat());

    if (!server.bind(entrypoint, grpc.ServerCredentials.createInsecure())) {
        process.exit(1);
    }

    server.start();

    console.log(`Server started on ${entrypoint}`);
}

main();
