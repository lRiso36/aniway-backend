import requests

url = "https://graphql.anilist.co"

query = """
query {
  Page(perPage: 1) {
    media(type: ANIME, sort: ID_DESC) {
      id
    }
  }
}
"""

response = requests.post(url, json={"query": query})

print("Status code:", response.status_code)
print("Raw response:", response.text)

if response.status_code == 200:
    data = response.json()
    highest_id = data["data"]["Page"]["media"][0]["id"]
    print("\nHighest anime ID currently on AniList:", highest_id)