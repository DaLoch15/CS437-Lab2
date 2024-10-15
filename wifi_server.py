import socket
import picar_4wd as fc
import time
import subprocess

HOST = "192.168.88.175"  # IP address of your Raspberry PI
PORT = 65432            # default port to listen on

power_val = 50 
direction = "Stopped"
distance_traveled = 0
start_time = None

def get_temperature():          # cpu_temperature
    raw_cpu_temperature = subprocess.getoutput("cat /sys/class/thermal/thermal_zone0/temp")
    cpu_temperature = round(float(raw_cpu_temperature)/1000,2)               # convert unit
    #cpu_temperature = 'Cpu temperature : ' + str(cpu_temperature)
    return cpu_temperature


def handle_key_input(key):
    global power_val, start_time, distance_traveled, direction
    if key == '6':  # increase power
        if power_val <= 90:
            power_val += 10
            print("Increased power_val:", power_val)
    elif key == '4':  # decrease power
        if power_val >= 10:
            power_val -= 10
            print("Decreased power_val:", power_val)
    elif key == 'w':  # move forward
        direction = "Forward"
        if start_time is None:  # start the timer if it's not already running
            start_time = time.time()
        fc.forward(power_val)
        print("Moving forward")
    elif key == 'a':  # turn left
        fc.turn_left(power_val)
        print("Turning left")
    elif key == 's':  # move backward
        direction = "Backward"
        if start_time is None:  # start the timer if it's not already running
            start_time = time.time()
        fc.backward(power_val)
        print("Moving backward")
    elif key == 'd':  # turn right
        fc.turn_right(power_val)
        print("Turning right")
    else:
        if start_time is not None:
            time_elapsed = time.time() - start_time
            # equation derived to calculate distance which ends up being meters
            distance_traveled += power_val * time_elapsed / 100
            start_time = None
        fc.stop()  # stop the car for random key
        print("Stopping PiCar")
    if key == 'q':  # quit command
        print("Quitting control")
        return False # quiting

    return True  # sontinue running

with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
    s.bind((HOST, PORT))
    s.listen()
    print(f"Listening on {HOST}:{PORT}")

    try:
        while True:
            client, clientInfo = s.accept()
            print("Connected to client:", clientInfo)

            with client:
                while True:
                    data = client.recv(1024)
                    if not data:
                        break  # client disconnected

                    # decode the received data into a string
                    key = data.decode('utf-8').strip()
                    print(f"Received key: {key}")

                    # handle the key input
                    if not handle_key_input(key):
                        client.sendall(b"Server: Quitting control")
                        break  # xit if 'q' is received

                    temperature = get_temperature()
                    info = f"Server: Executed {key}. Direction: {direction}, Speed: {power_val}, Distance: {distance_traveled:.2f} m, Temperature: {temperature}"
                    # Echo back to client as confirmation
                    client.sendall(info.encode('utf-8'))

    except Exception as e:
        print("An error occurred:", e)
    finally:
        print("Closing socket")
        s.close()
