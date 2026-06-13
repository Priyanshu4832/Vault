


// get the element where i want to toggle that is make hidden or not
const loginForm = document.getElementById('login-wrapper');
const registerForm = document.getElementById('register-wrapper');


// get the links which upon clicking will toggle

const loginLink = document.getElementById('to-login');
const registerLink = document.getElementById('to-register');


function toggleForm(){
    loginForm.classList.toggle('hidden');
    registerForm.classList.toggle('hidden');
}

// when you clcik login link make register form hidden and login visible
loginLink.addEventListener('click' , toggleForm)
//when you click register link make login hidden and register visisble
registerLink.addEventListener('click' , toggleForm);

if(localStorage.getItem('token')) {
    window.location.href = 'dashboard.html';
}

// handle login
async function handleLogin() {
    const errorElement = document.getElementById('login-error');

    try{

        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;


        errorElement.classList.remove('show');


        if(!email || !password){
            errorElement.textContent = 'Please enter all feilds';
            errorElement.classList.add('show');
            return ;
        }
     

        const res = await fetch('http://localhost:5000/api/auth/login',
            {
                method : 'POST',
                headers : { 'content-type' : 'application/json'},
                body : JSON.stringify({email , password})
            }
        );

        const data = await res.json();
        if(res.ok){
            localStorage.setItem('token' , data.token);
            window.location.href = 'dashboard.html';
        }
        else{
            errorElement.textContent = data.message || 'Login Failed';
            errorElement.classList.add('show');
        }

    }
    catch(err){
        errorElement.textContent = 'Something went wrong. Try again.';
        errorElement.classList.add('show');
    }
   
}


// handle register
async function handleRegister() {
    const errorElement = document.getElementById('register-error');

    try{

        const name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;


        errorElement.classList.remove('show');


        if(!name || !email || !password){
            errorElement.textContent = 'Please enter all feilds';
            errorElement.classList.add('show');
            return ;
        }
     

        const res = await fetch('http://localhost:5000/api/auth/register',
            {
                method : 'POST',
                headers : { 'content-type' : 'application/json'},
                body : JSON.stringify({name , email , password})
            }
        );

        const data = await res.json();
        if(res.ok){
            localStorage.setItem('token' , data.token);
            window.location.href = 'dashboard.html';
        }
        else{
            errorElement.textContent = data.message || 'Register Failed';
            errorElement.classList.add('show');
        }

    }
    catch(err){
        errorElement.textContent = 'Something went wrong. Try again.';
        errorElement.classList.add('show');
    }
   
}


const signinButton = document.getElementById('login-btn');
const registerButton = document.getElementById('register-btn');

if (signinButton) signinButton.addEventListener('click', handleLogin);
if (registerButton) registerButton.addEventListener('click', handleRegister);