from lark import Lark, Transformer
from pathlib import Path
from .models import ACLEntry
from django.db.models import Q
from django.db.models.expressions import RawSQL

parser = Lark(
    open(Path(__file__).resolve().parent.joinpath("scope.lark"), "r")
)


class T(Transformer):
    def start(self, args):
        return args[0]

    def scope(self, args):
        return args

    def resourcescope(self, args):
        return {"type": args[0], "name": args[1], "actions": args[2:]}

    def resourcetype(self, args):
        if len(args) > 1:
            return f"{args[0]}({args[1]})"
        else:
            return args[0]

    def resourcename(self, args):
        return "/".join(args)

    def hostname(self, args):
        if args[-1]["type"] == "port":
            return (
                ".".join([item["value"] for item in args[:-1]])
                + ":"
                + args[-1]["value"]
            )
        else:
            return ".".join([item["value"] for item in args])

    def HOSTCOMPONENT(self, args):
        return {"type": "hostcomponent", "value": args}

    def PORTNUMBER(self, content):
        return {"type": "port", "value": str(content)}

    def component(self, content):
        return "".join(content)

    def ACTION(self, content):
        return str(content)

    def ALPHANUMERIC(self, content):
        return str(content)

    def RESOURCETYPEVALUE(self, content):
        return str(content)

    def SEPARATOR(self, content):
        return str(content)


def parse_scopes(scope_str):
    tree = parser.parse(scope_str)
    return T().transform(tree)


def assert_scope(scope, user):
    actions_required = set(scope["actions"])
    actions_avaiable = set()
    if user.is_staff:
        actions_avaiable.add("*")
        actions_avaiable.add("pull")
    for entry in (
        ACLEntry.objects.filter(Q(user=user) & Q(type=scope["type"]))
        .annotate(matches=RawSQL("%s GLOB name", (scope["name"],)))
        .filter(matches=True)
    ):
        for action in entry.actions.split(","):
            actions_avaiable.add(action.strip())
    return list(actions_required.intersection(actions_avaiable))