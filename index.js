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
		usernames[username] = {
			id: socket.id,
			name: username,
			oldLeft: 0,
			oldTop: 0,
			left: 0,
			top: 0,
		};
		io.emit("adduser", username);
	});

	socket.on("gameLoop", () => {
		let newGame = {
			width: 600,
			height: 400,
			heroes: Object.values(usernames),
		};
		io.emit("gameLoop", newGame);
	});

	socket.on("hero_move", (username, x, y) => {
		let userNewPos = {
			...usernames[username],
			oldLeft:
				usernames[username] && usernames[username].left
					? usernames[username].left
					: 0,
			oldTop:
				usernames[username] && usernames[username].top
					? usernames[username].top
					: 0,
			top: y,
			left: x,
		};
		usernames[username] = userNewPos;
		io.emit("hero_move", userNewPos);
	});

	socket.on("disconnect", function () {
		Object.values(usernames).map((user) => {
			user.id === socket.id && delete usernames[user.name];
		});
	});
});

http.listen(port, () => {
	console.log(`Socket.IO server running at http://localhost:${port}/`);
});
