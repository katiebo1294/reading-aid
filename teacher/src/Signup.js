import React, { Component } from "react";
import firebase from "firebase/app";
import "firebase/database";
import './Form.css'

class Signup extends Component {
    constructor(props) {
        super(props);
        this.state = {
            first_name: '',
            last_name: '',
            email: '',
            username: '',
            password: '',
        };
        this.handleInputChange = this.handleInputChange.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    /* Event listener for form inputs */
    handleInputChange(event) {
        const value = event.target.value;
        const name = event.target.name;

        this.setState({[name]: value});
    }

    /* Use Firebase to authenticate user; if successful, create new account in the database and redirect to the user's homepage */
    handleSubmit(event) {
        event.preventDefault();
        // get info from form
        const first_name = this.state.first_name;
        const last_name = this.state.last_name;
        const email = this.state.email;
        const password = this.state.password;
        var user;
        // authenticate
        firebase.auth().createUserWithEmailAndPassword(email, password).then((userCredential) => {
            user = userCredential.user;
            return user.updateProfile({
                displayName: first_name + " " + last_name,
            }).then(() =>{
                console.log(user.displayName);
                // also add an entry for this user in the database
                firebase.database().ref('teachers').child(user.uid).set({
                    username: user.displayName,
                    email: user.email,
                });
                this.props.login();
            }).catch((error) => {
                console.log(error.message);
            });
            
        }).catch((error) => {
            alert(error.message);
        });
        
    }

    /* Renders the create account form */
    render() {
        return (
            <form id="signup-form" className="text-center">
                <legend><h3>Create an Account</h3></legend>
                <div className="form-group">
                    <input name="first_name" type="text" className="form-control form-control-lg" placeholder="First Name" value={this.state.first_name} onChange={this.handleInputChange} />
                </div>
                <div className="form-group">
                    <input name="last_name" type="text" className="form-control form-control-lg" placeholder="Last Name" value={this.state.last_name} onChange={this.handleInputChange} />
                </div>
                <div className="form-group">
                    <input name="email" type="email" className="form-control form-control-lg" placeholder="Email" value={this.state.email} onChange={this.handleInputChange} />
                </div>
                <div className="form-group">
                    <input name="password" type="password" className="form-control form-control-lg" placeholder="Password" value={this.state.password} onChange={this.handleInputChange} />
                </div>
                <button id="login-link" type="button" className="form-text text-muted link-button" onClick={this.props.switchView}>Already have an account? Log in here</button>
                <div className="form-group">
                    <input id="signup-submit" type="submit" className="btn btn-lg dark-btn" value="CREATE" onClick={this.handleSubmit} />
                </div>
            </form>
        );
    }
}
    
export default Signup;