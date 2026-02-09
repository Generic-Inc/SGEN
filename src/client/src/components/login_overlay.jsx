import {postData} from "../static/api.js";
import InputBox from "./sub components/input_box.jsx";

export default function LoginOverlay() {
    async function handleSubmit(event) {
        event.preventDefault();
        const errorEl = document.getElementById("error-message");
        if (errorEl) errorEl.textContent = "";


        const formData = new FormData(event.currentTarget);
        const dataObj = Object.fromEntries(formData.entries())
        const username = dataObj.username;
        if (username.includes("@")) {
            dataObj.email = username;
            delete dataObj.username;
        }

        try {
            const res = await postData("auth/login", dataObj);

            if (res?.error) {
                if (errorEl) errorEl.textContent = res.error;
                return;
            }

            console.log(res);
            window.location.href = "/"

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
                    <h2>Log In</h2>
                    <div className="form-group">
                        <InputBox iconName="person" inputType="text" placeholder="Username/Email" name="username"/>
                        <InputBox iconName="password" inputType="password" placeholder="Password" name="password"/>
                    </div>
                    <span className="form-change-text">Don't have an account? <a href="/signup">Sign Up!</a></span>
                    <span id="error-message"></span>
                    <div className="button-box">
                        <button type="submit">Log In</button>
                    </div>
                </form>
            </div>
        </>
    )
}
