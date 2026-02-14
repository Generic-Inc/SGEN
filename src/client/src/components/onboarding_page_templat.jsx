import "../static/styles/login_signup.css";
import InputBox from "./sub components/input_box.jsx";
import {checkStatus, postData} from "../static/api.js";
import {useEffect, useState} from "react";

export default function OnboardingOverlay() {
    const [status, setStatus] = useState(null);
    useEffect(() => {
        setStatus(checkStatus());
    }, [])
    console.log(status);
    async function handleSubmit(event) {
        event.preventDefault();
        const errorEl = document.getElementById("error-message");
        if (errorEl) errorEl.textContent = "";

        const formData = new FormData(event.currentTarget);
        const dataObj = Object.fromEntries(formData.entries());

        if (!dataObj.age || !dataObj.region || !dataObj.interest) {
             if (errorEl) errorEl.textContent = "Please fill out all required fields.";
             return;
        }

        try {
            const res = await postData("user/onboarding", dataObj);

            if (res?.error) {
                if (errorEl) errorEl.textContent = res.error;
                return;
            }

            console.log("Onboarding complete:", res);

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
                    <h2>Complete Profile</h2>
                    <p className="form-change-text" style={{marginBottom: "15px"}}>Tell us a bit more about yourself!</p>

                    <div className="form-group">
                        <InputBox iconName="cake" inputType="number" placeholder="Age" name="age" />
                        <InputBox iconName="badge" inputType="text" placeholder="Pronouns (eg, they/them)" name="pronouns" />
                        <InputBox iconName="location_on" inputType="text" placeholder="Region (North, South...)" name="region" required={false}/>

                        <InputBox iconName="star" inputType="textarea" placeholder="Talk about Interests" name="interest" />
                    </div>

                    <span id="error-message" style={{color: "red"}}></span>

                    <div className="button-box">
                        <button type="submit">Finish Setup</button>
                    </div>
                </form>
            </div>
        </>
    );
}