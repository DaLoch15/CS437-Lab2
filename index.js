document.onkeydown = updateKey;
document.onkeyup = resetKey;

var server_port = 65432;
var server_addr = "192.168.88.175";   // the IP address of your Raspberry PI

function send_data(keyCode) {
    const net = require('net');

    // Create a connection to the Raspberry Pi
    const client = net.createConnection({ port: server_port, host: server_addr }, () => {
        console.log('Connected to Raspberry Pi server');
        // Send the keycode to the server
        client.write(`${keyCode}\r\n`);
    });

    // Handle data response from the server
    client.on('data', (data) => {
        console.log('Received from server:', data.toString());
        // update the UI or display server data if necessary
        const serverResponse = data.toString();
    
        // fetch ui elements from server
        const directionMatch = serverResponse.match(/Direction: (\w+)/);
        const speedMatch = serverResponse.match(/Speed: (\d+)/);
        const distanceMatch = serverResponse.match(/Distance: ([\d\.]+) m/);
        const temperatureMatch = serverResponse.match(/Temperature: ([\d\.]+)/);
        
        if (directionMatch) {
            document.getElementById("direction").innerText = directionMatch[1];
        }
        if (speedMatch) {
            document.getElementById("speed").innerText = speedMatch[1];
        }
        if (distanceMatch) {
            document.getElementById("distance").innerText = distanceMatch[1];
        }
        if (temperatureMatch) {
            document.getElementById("temperature").innerText = temperatureMatch[1];
        }


        client.end();  // close the connection after receiving data
    });

    client.on('end', () => {
        console.log('Disconnected from server');
    });

    client.on('error', (err) => {
        console.error('Connection error:', err.message);
    });
}



// for detecting which key is been pressed w,a,s,d
function updateKey(e) {


    if (e.keyCode == '87') {
        // up (w)
        document.getElementById("upArrow").style.color = "green";
        send_data("w");
    }
    else if (e.keyCode == '83') {
        // down (s)
        document.getElementById("downArrow").style.color = "green";
        send_data("s");
    }
    else if (e.keyCode == '65') {
        // left (a)
        document.getElementById("leftArrow").style.color = "green";
        send_data("a");
    }
    else if (e.keyCode == '68') {
        // right (d)
        document.getElementById("rightArrow").style.color = "green";
        send_data("d");
    }
    else if (e.keyCode == '81') {  // 'q' key for stopping
        send_data("q");  // Send 'q' to stop the PiCar and exit
        console.log('Quitting the PiCar control');
    }
    else if (e.keyCode == '52') {
        // decrease power
        send_data("4");
        console.log('Decreasing speed');
    }
    else if (e.keyCode == '54') {
        // increase power
        send_data("6");
        console.log('Increasing speed');
    }

}

// reset the key to the start state 
function resetKey(e) {


    document.getElementById("upArrow").style.color = "grey";
    document.getElementById("downArrow").style.color = "grey";
    document.getElementById("leftArrow").style.color = "grey";
    document.getElementById("rightArrow").style.color = "grey";

    send_data("stop");
}


// update data for every 50ms
function update_data(){
    setInterval(function(){
        // get image from python server
        client();
    }, 50);
}
