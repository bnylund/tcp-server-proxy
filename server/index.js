let ports = [];

const uuid = require('uuid').v4;
const Net = require('net');
const httpServer = require("http").createServer();
const io = require("socket.io")(httpServer, {});

io.on("connection", (socket) => {
  socket.on("register", (port, cb) => {
    if(bindings.find(x => x.port === port)) {
      cb("Port taken.");
      return;
    }

    // Create TCP Server, add to bindings
    const server = new Net.Server();
    server.listen(port, () => {
      ports.push(port); 
      cb(undefined);
    });

    server.on('error', (err) => {
      socket.emit('server error', err);
    });

    server.on('close', () => {
      socket.emit('server close');
      ports = ports.filter(x => x !== port);
    });

    server.on('connection', (servSock) => {
      const id = uuid();
      socket.emit('server connection', id);

      servSock.on('close', (err) => {
        socket.emit("close", id, err);
      });
      servSock.on('connect', () => {
        socket.emit('connect', id);
      });
      servSock.on('drain', () => {
        socket.emit('drain', id);
      });
      servSock.on('end', () => {
        socket.emit('end', id)
      })
      servSock.on("data", (chunk) => {
        socket.emit("data", id, chunk);
      });

      socket.on("data", (sid, chunk) => {
        if(sid === id) {
          servSock.write(chunk);
        }
      })
    });
  });
});

httpServer.listen(9050);