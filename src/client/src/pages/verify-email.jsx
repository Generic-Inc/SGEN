import "../static/styles/login_signup.css"
import InputBox from "../components/sub components/input_box.jsx";
import { postData } from "../static/api.js";
import {useNavigate} from "react-router-dom";

export default function VerifyEmail() {
    const navigate = useNavigate();
    async function handleSubmit(event) {
        event.preventDefault();
        const errorEl = document.getElementById("error-message");
        if (errorEl) errorEl.textContent = "";

        const formData = new FormData(event.currentTarget);
        const dataObj = Object.fromEntries(formData.entries());
        dataObj["email"] = new URLSearchParams(window.location.search).get("email") || "";

        try {
            const res = await postData("auth/verify-email", dataObj);

            if (res?.error) {
                if (errorEl) errorEl.textContent = res.error;
                return;
            }

            console.log(res);
            const targetPath = `/onboarding`;

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
                    <h2>Verify Email</h2>
                    <p style={{textAlign: "center", marginBottom: "20px", color: "var(--text-color)"}}>
                        Please enter your email and the verification code sent to your inbox.
                    </p>
                    <div className="form-group">
                        <InputBox iconName="key" inputType="text" placeholder="Verification Code" name="verificationCode" required />
                    </div>
                    <span id="error-message"></span>
                    <div className="button-box">
                        <button type="submit">Verify</button>
                    </div>
                </form>
            </div>
        </>
    )
}
