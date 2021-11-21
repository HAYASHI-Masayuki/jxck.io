'use strict';

const logger = console.log.bind(console);

// export handler
export default function echo(request) {
  const protocol = request.requestedProtocols[0];

  const connection = request.accept(protocol);
  logger('accept', protocol);

  connection.on('message', (message) => {
    if (message.type !== 'utf8') {
      return connection.drop(connection.CLOSE_REASON_UNPROCESSABLE_INPUT, 'support utf8 only');
    }
    logger('message', message);
    connection.send(message.utf8Data);
  });

  connection.on('close', (reasonCode, description) => {
    logger('close', connection.remoteAddress, reasonCode, description);
  });

  connection.on('error', (err) => {
    logger('error', err);
  });
}
