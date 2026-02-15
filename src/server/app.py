from flask import Flask
import traceback

app = Flask(__name__)

@app.route("/")
def home():
    try:
        print("ROUTE HIT")
        return "HELLO WORLD"
    except Exception as e:
        print("ERROR:", e)
        traceback.print_exc()
        return "error", 500
