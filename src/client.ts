import { createInterface } from 'readline';

import grpc from 'grpc';
import { Empty } from 'google-protobuf/google/protobuf/empty_pb';

import { ChatClient } from './protos/chat_grpc_pb';
import { GetMessagesReply, Message } from './protos/chat_pb';

const rl = createInterface({
    input: process.stdin,
    output: process.stdout
});

function main() {
    const client = new ChatClient(
        '0.0.0.0:50051',
        grpc.credentials.createInsecure()
    );

    const username = process.argv[2];

    client.getMessages(new Empty(), (err: grpc.ServiceError | null, reply: GetMessagesReply) => {
        exitWhenError(err);

        for (const message of reply.getItemsList()) {
            printMessage(message);
        }

        const stream = client.streamMessages(new Empty());

        stream.on('data', printMessage);

        rl.on('line', (line: string) => {
            const message = new Message();

            message.setUsername(username);
            message.setText(line);

            client.sendMessage(message, exitWhenError);

            rl.prompt();
        });

        rl.prompt();
    });
}

function printMessage(message: Message) {
    console.log(`${message.getUsername()}: ${message.getText()}`);
}

function exitWhenError(err: grpc.ServiceError | null) {
    if (err) {
        console.error(err);

        process.exit(1);
    }
}

main();
