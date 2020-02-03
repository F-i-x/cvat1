# High Level Design of Role Based Access Control (RBAC)

Authentication application will be renamed to `auth` to emphasize its role not
only in authentication process but as well in authorization.

## Ideas for implementation

- Use [Django Role Permissions](https://github.com/vintasoftware/django-role-permissions) application.
It is supported by a commercial company. The main problems are only users can have roles, don't have
hierarchical roles.
- Use [Pycasbin](). It is necessary to implement own app.

## REST API for RBAC

### Roles

Define roles and their permissions.

- `GET, POST /api/v1/auth/roles`
- `DELETE, PATCH, PUT, GET /api/v1/auth/roles/{id}`

```json
{
    "name": "@ADMIN",
    "policies": [{
        "scope": ["*"],
        "objects": ["*"],
        "actions": ["*"],
    }],
}
```

```json
{
    "name": "@OWNER",
    "policies": [{
        "scope": ["LINKED"],
        "objects": ["*"],
        "actions": ["*"],
    }],
}
```

```json
{
    "name": "@USER",
    "policies": [{
        "scope": ["PUBLIC", "PRIVATE"],
        "objects": ["PROJECT", "TASK", "JOB", "MODEL"],
        "actions": ["CREATE"],
    }],
    "roles": ["@ANNOTATOR", "@OBSERVER"]
}
```

```json
{
    "name": "@ANNOTATOR",
    "policies": [{
        "scope": ["LINKED"],
        "objects": ["PROJECT", "TASK", "JOB", "MODEL"],
        "actions": ["ACCESS", "COMMENT", "ANNOTATE"],
    }],
    "roles": ["@OBSERVER"]
}
```

```json
{
    "name": "@OBSERVER",
    "policies": [{
        "scope": ["PUBLIC", "LINKED"],
        "objects": ["*"],
        "actions": ["ACCESS"],
    }],
}
```

### Rules

Link a subject with an object and assign a specific role.

- `GET, POST /api/v1/auth/rules`
- `DELETE, PUT, GET /api/v1/auth/rules/{id}`

```json
{
    "role": "@OWNER",
    "subject": "users/{id}",
    "object": "projects/{id}",
}
```

```json
{
    "role": "@USER",
    "subject": "groups/{id}",
    "object": "tasks/{id}",
}
```

Add roles for groups and users in context of the whole app (object is None).

```json
{
    "subject": "users/{id}",
    "role": "@USER",
}
```

```json
{
    "subject": "groups/{id}",
    "role": "@USER",
}
```

## Admin panel

It should be possible to manage roles and rules using admin panel.

## Default roles

- ADMIN
- OWNER
- USER
- ANNOTATOR
- OBSERVER

## Actions

- CREATE
- CHANGE
- DELETE
- ACCESS
- COMMENT
- ANNOTATE

## Objects

- TASK
- PROJECT
- JOB
- MODEL
- USER
- GROUP
- ROLE
- RULE

## Scope

- PUBLIC: public tasks, models, projects, etc...
- PRIVATE: private tasks, models, projects, etc...
- LINKED: own or assigned tasks, projects, etc...

## Permissions inheritance

A user can have a global role and a role for a specific project, task, or job.
Each inner scope extends permissions of an outer scope but never can reduce permissions.
If somebody has @ADMIN role in CVAT it is not possible to reduce permissions for an
object (e.g. project, task, job, model). Somebody can have @USER role for a project and
@OWNER role for a task inside the project with corresponding permissions for these
objects.

## DB layout

### Change Project/Task/Job

Need to add `shared` flag (or `is_public`) for all models. If a model doesn't
have such flag (e.g. User, Group) it is public by default.

### DB models

```python
class Policy(models.Model):
    role = models.ForeignKey(Role)
    scope = models.CharField(max_length=1024)
    objects = models.CharField(max_length=1024)
    actions = models.CharField(max_length=1024)

class Role(models.Model):
    name = models.CharField(max_length=256, unique=True)

class Rule(models.Model):
    role = models.ForeignKey(Role)
    subject = GenericForeignKey()
    object = GenericForeignKey()
```

## Implementation details

One of possible ways to implement the logic is to use [pycasbin](https://github.com/casbin/pycasbin).
Casbin is an authorization library that supports access control models like ACL, RBAC, ABAC for
different languages.

The configuration file:

```ini
[request_definition]
r = sub, obj, act

[policy_definition]
p = sub, obj, act, scope

[role_definition]
g = _,_

[policy_effect]
e = some(where (p.eft == allow))

[matchers]
m = match_role(r.sub, r.obj, p.sub) && \
    match_scope(r.sub, r.obj, p.scope) && \
    match_object(r.obj, p.obj) && \
    match_action(r.act, p.act)
```

Here `match_role`, `match_action`, `match_object`, and `match_scope` functions which should
be defined somewhere in our code.

- match_role: (r.sub, r.obj) -> p.sub. In common case the role can be defined by
the object as well (using rules).
- match_scope: (r.sub, r.obj) -> p.scope. In case of `PUBLIC` or `PRIVATE` scope it
is enough to use only the object. But to determine `LINKED` scope it is necessary
to know the subject as well.
- match_object: r.obj -> p.obj (regexp match)
- match_action: r.act -> p.act (regexp match)

Polices for casbin should be provided using [an adapter](https://casbin.org/docs/en/adapters).
Roles and rules will be loaded from the adapter.
