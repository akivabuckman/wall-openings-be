import json
import urllib.request
import urllib.error


def delete_old_walls():
    # url = "https://akivabuckman.com/wall-openings/api/old-walls"
    url = "http://localhost:5000/old-walls"
    req = urllib.request.Request(url, method="DELETE")
    try:
        with urllib.request.urlopen(req) as response:
            body = response.read().decode("utf-8")
            return {
                "statusCode": response.status,
                "body": body,
            }
    except urllib.error.HTTPError as e:
        return {
            "statusCode": e.code,
            "body": e.read().decode("utf-8"),
        }
    except urllib.error.URLError as e:
        return {
            "statusCode": 500,
            "body": str(e.reason),
        }


def lambda_handler(event, context):
    result = delete_old_walls()
    output = {
        "statusCode": result["statusCode"],
        "body": json.dumps(result["body"]),
    }
    print(output)

lambda_handler(1,2)