import requests
from bs4 import BeautifulSoup
import json
import math

# const 
filename = "fifa16_"
pageIndex = 4
host = "http://www.futhead.com/"

# main crawler
feeds = []
resp = requests.get("".join([host, "16/players/hot/?page=", "{0}".format(pageIndex)]))
soup = BeautifulSoup(resp.text, 'html.parser')
player_profiles = soup.find_all("a", class_="display-block padding-0")
curr_file = "".join([filename, "{0}".format(pageIndex), ".json"])

for curr_player in player_profiles: 

    profile = {}

    # personal profile
    profile['name'] = curr_player.find("span", class_="player-name").string
    profile['url'] = curr_player['href']
    profile['rat'] = curr_player.find("span", class_="revision-gradient").string
    profile['image'] = curr_player.find("img", class_="player-image")['src']

    # find id
    start = len("/16/players/")
    profile['id'] = profile['url'][start: (profile['url'].find('/', start))]

    # find the nation
    nation = {}
    nation['icon'] = curr_player.find("img", class_="player-nation")['src']

    # find the club
    club = {}
    club['icon'] = curr_player.find("img", class_="player-club")['src']

    # find the abilities
    ability = {}
    abilities = curr_player.find_all("span", class_="player-stat stream-col-50 hidden-md hidden-sm hidden-xs")

    for ab in abilities:
        key = ab.find("span", class_="hover-label")
        value = ab.find("span", class_="value")
        ability[key.string.lower()] = value.string

    profile['ability'] = ability

    # find the name of club and nation
    resp_detail = requests.get("".join([host, profile['url']]))
    soup_detail = BeautifulSoup(resp_detail.text, 'html.parser')
    belongs = soup_detail.find_all("a", class_="futhead-link")

    nation['name'] = belongs[2].string
    club['name'] = belongs[0].string

    profile['nation'] = nation
    profile['club'] = club

    # age
    side_item = soup_detail.select(".player-sidebar-item")[6]
    profile['age'] = side_item.find("div", class_="player-sidebar-value").string
    try:
        int(profile['age'])
    except:
        side_item = soup_detail.select(".player-sidebar-item")[7]
        profile['age'] = side_item.find("div", class_="player-sidebar-value").string

    # price
    resp_price = requests.get("".join([host, "16/players/{0}/prices/all/".format(profile['id'])]))
    
    try:
        profile['price'] = json.loads(resp_price.text)['ps_lowest_bin']
        rat_value = int(profile['rat'])
        profile['cp'] = math.ceil(profile['price'] / rat_value)
    except:
        profile['price'] = -2
        profile['cp'] = -1
    else:
        with open(curr_file, mode='w') as feedsjson:
            feeds.append(profile)
            json.dump(feeds, feedsjson, indent=2)

    print profile
    print "\n"

    
    