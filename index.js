const app = require("express")();
const http = require("http").Server(app);
const io = require("socket.io")(http);
const port = process.env.PORT || 3001;

let usernames = {};

app.get("/", (req, res) => {
	res.sendFile(__dirname + "/");
});

io.on("connection", (socket) => {
	socket.on("adduser", (username) => {
		socket.username = username;
		usernames[username] = {id: socket.id, name: username, left: 0, top: 0};
		io.emit("adduser", username);
	});

	socket.on("hero_move", (username, x ,y) => {
		let userNewPos = {
			...usernames[username],
			top: y,
			left: x
		}
		usernames[username] = userNewPos;
		io.emit("hero_move", userNewPos);
	});

	socket.on('disconnect', function() {
		Object.values(usernames).map((user) => {
			user.id === socket.id && delete usernames[user.name]
		})
	});
});

http.listen(port, () => {
	console.log(`Socket.IO server running at http://localhost:${port}/`);
});
