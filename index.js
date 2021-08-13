const app = require("express")();
const http = require("http").Server(app);
const io = require("socket.io")(http);
const port = process.env.PORT || 3001;

let usernames = {};
let mapWidth = 0;
let mapHeight = 0;
let apples = [];

app.get("/", (req, res) => {
	res.sendFile(__dirname + "/");
});

function getRandomColor() {
	var letters = "0123456789ABCDEF";
	var color = "#";
	for (var i = 0; i < 6; i++) {
		color += letters[Math.floor(Math.random() * 16)];
	}
	return color;
}

function spawnApple(n) {
	for (let i = 0; i < n; i++) {
		apples.push({
			x: Math.floor(Math.random() * mapWidth),
			y: Math.floor(Math.random() * mapHeight),
			size: Math.floor(Math.random() * 9) + 5,
			color: getRandomColor(),
		});
	}
}

io.on("connection", (socket) => {
	socket.on("adduser", (username) => {
		socket.username = username;
		usernames[username] = {
			id: socket.id,
			name: username,
			color: getRandomColor(),
			oldLeft: 0,
			oldTop: 0,
			left: 0,
			top: 0,
			size: 20,
			score: 0,
		};
		io.emit("adduser", username);
	});

	socket.on("resize", (width, height) => {
		mapWidth = width;
		mapHeight = height;
		if (apples.length < 62) {
			spawnApple(62 - apples.length);
		}
	});

	socket.on("gameLoop", () => {
		let newGame = {
			heroes: Object.values(usernames),
			apples: apples,
		};
		io.emit("gameLoop", newGame);
	});

	socket.on("hero_move", (username, x, y) => {
		apples.forEach((apple, index) => {
			if (usernames[username] && x !== null && y !== null) {
				if (
					x - usernames[username].size < apple.x &&
					apple.x < x + usernames[username].size &&
					y - usernames[username].size < apple.y &&
					apple.y < y + usernames[username].size
				) {
					apples.splice(index, 1);
					usernames[username] = {
						...usernames[username],
						size:
							usernames[username].size + apple.size / usernames[username].size,
						score: usernames[username].score + apple.size,
					};
				}
				if (apples.length < 62) {
					spawnApple(1);
				}
			}
		});
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
