var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = 3354;
var host = "127.0.0.1";


app.get("/",function(req,resp){
	resp.sendfile("index.html");
});
var player_count=0;
var players =
[
{
   "id" :" ",
   "x"  :0
},
{
	"id" :" ",
     "x"  :0,
     "y" : 200
}
];

var ball =
{
	"state":"idle",
	"x" : 50,
	"y" : 50,
	"xvel": 15,
	"yvel": 15 
};
var set = false;
var slot = 0;
function randomInt (low, high) {
    return Math.floor(Math.random() * (high - low) + low);
}

io.on("connection",function(socket){

	player_count+=1;
	if(player_count == 1)//first player joined
	{
		players[slot].id=socket.id;
		players[slot].x=0;
		console.log("aha player 1 is ",players[slot].id);
		slot+=1;
		//console.log(ball);
	}
	if(player_count==2) // game is live
	{

		players[slot].id=socket.id;
		players[slot].x=0;		
		console.log("player ",(slot+1)," is ",players[slot].id);
		ball.x=50;
		ball.y=50;
		ball.xvel=2;
		ball.yvel=3;
		ball.state="running";
		//console.log("STATE CHANGED!!!!");

	}
	//if(!set)
	//{
	setInterval(function(){
			//console.log("POLLING!!!");
			socket.emit("givedata");
    },60);
    //	set=true;
	//}
	if(player_count >= 3)
	{
		console.log("All slots are full!!");
		socket.disconnect();
		player_count = 2;
	}
	socket.on("mousepos",function(data){

		if(socket.id==players[0].id)
		{
			//console.log("player 1 moved!!")
			players[0].x=data.x;
		}
		if(socket.id==players[1].id)
		{
			//console.log("player 2 moved!!");
			players[1].x=data.x;
		}
		//console.log(data.x);
		
	});



	socket.on("givepos",function(data){
		//console.log(players[0].x+105,players[1].x+105,data.ww);

		//update ball
		ball.x = ball.x + ball.xvel;
		ball.y = ball.y + ball.yvel;

		//keep ball in window
		if(ball.x < 0 || ball.x+10 > data.ww)
		{
			ball.xvel= -1*ball.xvel;
		}
		if(ball.y < 0 || ball.y+10 > data.wh)
		{
			ball.x =randomInt(4,data.ww)%(data.ww-20);
			ball.y = Math.floor(data.wh/2);
			if(randomInt(5,10)%2==0)
				ball.xvel=-ball.xvel;
			if(randomInt(2,8)%2==0)
				ball.yvel=-ball.yvel;
		}
		//check collision with board
		//checking with player1
		if(ball.x >= players[0].x && ball.x+10 <=players[0].x+100) // x locked on
		{
			if(ball.y <= 5+10)
			{
				ball.yvel=-1*ball.yvel;
			}
		}

		//checking with player2
		if(ball.x >= players[1].x && ball.x+10 <=players[1].x+100) // x locked on
		{
			if(ball.y >= data.wh-60)
			{
				ball.yvel=-1*ball.yvel;
			}
		}
		//keep both the boards in the window
		if(players[0].x+105 > data.ww)
		{
			players[0].x = data.ww-105;
		}
		if(players[1].x+105 > data.ww)
		{
			players[1].x=data.ww-105;
		}
		players[1].y=data.wh-50;

		//console.log(ball);
		socket.emit("givingpos",[players,ball]);
	});

	socket.on("disconnect",function(){
		if(socket.id == players[0].id)
		{
			console.log("Player 1 Disconnected, Slot is now open !!",player_count);
			slot = 0;
			player_count-=1;
			ball.state="idle";
		}

		if(socket.id == players[1].id)
		{
			console.log("Player 2 Disconnected, Slot is now open !!",player_count);
			player_count-=1;
			slot = 1;
			ball.state="idle";
		}
	});
	console.log("connected !! ",socket.id);


});

http.listen(port,host,function(){
console.log("Server listening on "+host+":"+port);	
});

