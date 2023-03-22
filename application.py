import os

from flask import Flask, render_template
from flask_socketio import SocketIO, emit

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
socketio = SocketIO(app)

# used to keep track of all messags and users
groups = {} # {group : [ {user : -, text : -, time: -}] }
users = []

@app.route("/")
def index():
    return render_template("index.html", groups=groups, users=users)

# adds new user
@socketio.on('new user')
def newUser(data):
    user = data['username']
    nonce = 0
    while user in users:
        user += str(nonce)
        nonce+= 1
    users.append(user)
    emit('username', {'name': user})

    # lets everyone know about the new user
    emit('new user', {'username': user}, broadcast=True)

# adds new group 
@socketio.on('new group')
def newGroup(data):
    name = data['name']
    if name in groups:
        return -1
    groups[name] = []
    emit("new group", name, broadcast=True)

# used to return all messages of a group
@socketio.on('get messages')
def getMsg(data):
    group = data['group']

    if group in groups:
        messages = groups[group]
        emit('return messages', {'messages': messages})


# returns new message to all users
@socketio.on('send message')
def send(data):
    group = data['group']
    user = data['user']
    msg = data['message']
    time = data['time']
    
    if group in groups:

        # limits maximum number of messages per group to 100
        if len(groups[group]) == 100:
            groups[group].pop(0)

        groups[group].append({'user': user, 'text': msg, 'time':time})
        emit('receiveMsg', {'group': group, 'user':user, 'msg':msg, 'time':time}, broadcast=True)

app.run(debug=True)