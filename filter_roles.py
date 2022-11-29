import json
import re
d = json.load(open("data/roles.json", "r"))
data = {}
r = re.compile(r"^role[s]*:", re.IGNORECASE)
for k, v in d.items():
    if "role=" in v["role"]:
        data[k] = {"role": "", "aria_roles": []}
        data[k]["role"] = v["role"].split("=")[-1].strip()
        data[k]["role"] = "" if data[k]["role"] == "generic" else data[k]["role"]
        aria_roles = list(filter(lambda x: x.strip() != "",
                                 v["aria-roles"].split("\n")))
        m = r.match(aria_roles[0])
        if m:
            roles = aria_roles[0]
            start, end = m.span()
            roles = roles[end:].strip().split(",")
            for ro in roles:
                ro = ro.strip()
                if " or " in ro:
                    data[k]["aria_roles"].extend(
                        [i.strip() for i in ro.split("or")])
                    continue
                data[k]["aria_roles"].append(ro)
        elif "Any role" in aria_roles[0]:
            data[k]["aria_roles"].append("*")

json.dump(data, open("scripts/roles.json", "w"), indent=4)
