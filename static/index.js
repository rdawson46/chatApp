/*
TODO:
need to add timestamp to messages

maybe add typing animation for 'personalize' section
*/

document.addEventListener('DOMContentLoaded', ()=>{
    const socket = io()
    
    // function to set active group and load messages from group
    function setGroup(name){
        localStorage.setItem('activeGroup', name);
        document.getElementById('activeGroup').innerHTML = name;
        document.getElementById('chatBox').innerHTML = "";
        socket.emit('get messages', {'group': name});
    }

    // method to set up page when connected
    socket.on('connect', ()=>{
        console.log('connected to socket');

        // assigning groups to buttons
        document.querySelectorAll('.groupBtn').forEach(button => {
            button.onclick = () => {setGroup(button.innerHTML)};
        });
        

        // title active group
        if(localStorage.getItem('activeGroup')){
            setGroup(localStorage.getItem('activeGroup'))
        }
        
        // add group function
        document.getElementById('add').onclick = () =>{
            // when add group button hit, start prompt for new group name
            let input = document.createElement('input');
            input.type = 'text';
            input.autocomplete = "off";
            input.placeholder = "New Name";
            input.style = 'width: 80%; margin-top:2%;'
            
            // event listener for enter key
            input.addEventListener('keypress', (event)=>{
                if(event.key === 'Enter'){
                    let name = input.value;
                    socket.emit('new group', {'name':name});
                    input.blur();
                    setGroup(name);
                }
            });

            // inserting input bar on to page
            document.getElementById('groups').appendChild(input);

            // puts cursor into input
            input.focus();
            input.select();

            // if input is clicked off then input will be removed from page
            input.addEventListener('blur', (event)=>{
                input.remove();
            })
        }

        // send message with button
        document.getElementById('send').onclick = () =>{
            // if active group doesn't exist then ignore
            if(!localStorage.getItem('activeGroup')){return}

            // grabs input value and then sets to blank
            let text = document.getElementById('messageInput').value;
            document.getElementById('messageInput').value = '';

            // setting time and date to format in a humanly manner 
            const currDate = Date.now(); 

            const date = new Date(currDate);

            time = date.toLocaleTimeString(); 

            // sends message details to server
            socket.emit('send message', {'user':localStorage.getItem('user'), 'message':text, 'group':localStorage.getItem('activeGroup'), 'time':time});
        }

        // send message with enter key same as function above
        document.getElementById('messageInput').addEventListener('keypress', (event) =>{
            if(event.key === 'Enter'){
                if(!localStorage.getItem('activeGroup')){return}

                let text = document.getElementById('messageInput').value;
            document.getElementById('messageInput').value = '';
            
            // setting time for enter handler 
            const currDate = Date.now(); 

            const date = new Date(currDate);

            let time = date.toLocaleTimeString(); 

            socket.emit('send message', {'user':localStorage.getItem('user'), 'message':text, 'group':localStorage.getItem('activeGroup'), 'time':time});
            }
        });

        
        // determines what page user will see on start
        if(!localStorage.getItem('user')){
            // prompt user for username
            document.getElementById('login').hidden = false;

            document.getElementById('chat').style = "display:none"

            // signs user in on click and changes view of page
            document.getElementById('signIn').onclick = () => {
                let name = document.getElementById('nameEntry').value;
                if(name.length > 0){
                    socket.emit('new user', {'username': name})          
                    
                    document.getElementById('login').hidden = true;
                    document.getElementById('chat').style = '';
                }
                else{
                    document.getElementById('warning').innerHTML = "Invalid username";
                }
            }
        }else{
            // proceed to chat page if local user exists
            document.getElementById('chat').style = '';
        }
    });

    socket.on('username', (data)=>{
        let name = data.name;

        localStorage.setItem('user', name);
    })

    // adds new user to the user list
    socket.on('new user', (data)=>{
        let username = data.username;

        let userIndex = document.createElement('li');
        userIndex.classList.add('userIndex');
        userIndex.innerHTML = username;

        document.getElementById('userlist').appendChild(userIndex);
    })

    socket.on('new group', name => {
        // handles receiving information about a new group
        // create button for new group and appends to list of groups
        let group = document.createElement('button');
        group.classList.add('groupBtn')
        group.innerHTML = name;

        group.onclick = () => {setGroup(group.innerHTML)};

        let outer = document.createElement('li');
        outer.classList.add('groupIndex');
        outer.appendChild(group);

        document.getElementById('groups').appendChild(outer);
    });

    // function used when loading group data to retrieve all messages for active group
    socket.on('return messages', (data)=>{
        let messages = data.messages;

        // loops through all messages and adds them to chat page
        for(let i = 0; i < messages.length; i++){
            let msg = messages[i];

            let user = msg.user;
            let text = msg.text;

            let box = document.createElement('div');

            let time = msg.time; 
        
            
            box.innerHTML = `<i>${user}</i> <br> <p style=\"font-size:10px; margin:0;\">${text} <br> ${time} </p>`;
            if(user === localStorage.getItem('user')){
                // add message to right with blue color
                box.classList.add('userSent')
                
            } else{
                // add message to left with green color
                box.classList.add('userReceived')
            }

            // adds message to page then scrolls box to the bottom, where new message appears
            chatBox = document.getElementById('chatBox');
            chatBox.appendChild(box);
            chatBox.scrollTop = chatBox.scrollHeight;
        }
    });

    // function for updating chat box when sending or receiving messages
    socket.on('receiveMsg', (data)=>{
        // handles receiving messages in a group
        let group = data.group;
        let user = data.user;
        let msg = data.msg;
        let time = data.time; 

        // determines if active group needs updating
        if(group === localStorage.getItem('activeGroup')){
            let box = document.createElement('div');
            box.innerHTML = `<i>${user}</i> <br> <p style=\"font-size:10px; margin:0;\">${msg} <br> ${time} </p>`;

            // determines if message was sent by current user
            if(user === localStorage.getItem('user')){
                // add message to right with blue color
                box.classList.add('userSent')
                
            } else{
                // add message to left with gray color
                box.classList.add('userReceived')
            }

            // adds new message and scrolls to bottom
            let chatBox = document.getElementById('chatBox');
            chatBox.appendChild(box);
            chatBox.scrollTop = chatBox.scrollHeight;
        }
    });
});