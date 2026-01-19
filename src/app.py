from flask import Flask

app = Flask(__name__)

@app.route('/')
def test():
    return "yep, the root route works!"

if __name__ == '__main__':
    import subprocess
    subprocess.run(["flask", "run"])