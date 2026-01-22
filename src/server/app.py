from flask import Flask

from routing.api import api

app = Flask(__name__)
app.register_blueprint(api)

@app.route('/')
def test():
    return "yep, the root route works!"

if __name__ == '__main__':
    import subprocess
    subprocess.run(["flask", "run"])