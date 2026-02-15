import "../static/styles/login_signup.css"
import InputBox from "./sub components/input_box.jsx";
import {postData} from "../static/api.js";
import { useNavigate } from "react-router-dom";

export default function SignupOverlay() {
    const navigate = useNavigate();

    async function handleSubmit(event) {
        event.preventDefault();
        const errorEl = document.getElementById("error-message");
        if (errorEl) errorEl.textContent = "";

        const formData = new FormData(event.currentTarget);
        let password = formData.get("password").trim();

        if (password !== formData.get("confirmPassword").trim()) {
            if (errorEl) errorEl.textContent = "Passwords do not match!";
            return;
        }
        const dataObj = Object.fromEntries(formData.entries())

        try {
            const res = await postData("auth/signup", dataObj);

            if (res?.error) {
                if (errorEl) errorEl.textContent = res.error;
                return;
            }

            console.log("Signup success, redirecting...");

            const targetPath = `/verify-email?email=${encodeURIComponent(dataObj.email)}`;

            navigate(targetPath, { replace: true });
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            if (errorEl) errorEl.textContent = message;
        }

    }
    return (
        <>
            <div className="main-login-box">
                <form onSubmit={handleSubmit}>
                    <img src="https://i.ibb.co/YKjk4w4/SGEN-Logo.png" alt="Logo" className="logo-image"/>
                    <h2>Sign up</h2>
                    <div className="form-group">
                        <InputBox iconName="person" inputType="text" placeholder="Username" name="username"/>
                        <InputBox iconName="mail" inputType="email" placeholder="Email" name="email"/>
                        <InputBox iconName="password" inputType="password" placeholder="Password" name="password"/>
                        <InputBox iconName="password_2" inputType="password" placeholder="Confirm Password" name="confirmPassword"/>
                    </div>
                    <span className="form-change-text">Already have an account? <a href="/login">Log In!</a></span>
                    <span id="error-message"></span>
                    <div className="button-box">
                        <button type="submit">Sign up</button>
                    </div>
                </form>
            </div>
        </>
    )
}
