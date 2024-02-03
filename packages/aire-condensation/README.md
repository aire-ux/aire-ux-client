# Overview


Condensation is a library for transparently hydrating JavaScript or 
TypeScript objects from a variety of formats 
(JSON, XML, Avro, gRPC, Cap'n Proto)
## Usage

### JVM/Java

This process is optional, but if you use a JVM language and servlet technologies, then you
can map your JVM objects directly to Condensation-mapped objects and call methods remotely

### Define the AireServlet

```
    @Bean public ServletRegistrationBean<AireDesignerServlet> aireServlet() {
        return new ServletRegistrationBean(AireDesignerServlet, "context");  // servlet will be registered at "/web-context/context"
    }
```

# Generic Usage (backend-agnostic)

Define a data-transfer object:

```typescript
@RootElement
class Address {
  @Property({
    type: Number,
    read: {
      alias: "room-count",
    },
  })
  roomCount: number;

  @Property(String)
  city: string;
    
  showInfo() : void {
      console.log(`City: ${this.city}, Rooms: ${this.roomCount}`)
  }   
}
```

This object may be mounted from the following JSON document:

```json
{
  "room-count": 4,
  "city": "Fort Collins"
}

```
```typescript

/**
 this context can be made a global object
*/     
const context = Condensation.newContext();
const jsonDoc = await load('path/to/my/address'); // path returning above document
const address = ctx.create(Address, jsonDoc);

address.showInfo();
// logs City: Fort Collins, Rooms: 4
```

Condensation is capable of serializing/deserializing entire object-graphs,
including graphs that contain cycles:


```typescript
@Remotable
@RootElement
class Person {
    @Identity({properties:["commonName", "givenName"]})
    @Property(String)
    commonName: string;
    
    @Property({
        type: String,
        read: {
            alias: 'common-name' // can be read from "common-name" payload property
        },
        write: {
            alias: 'CommonName'  // will be written to "CommonName" payload property on write
        }
    })
    givenName: string;
    
    constructor(
        @Linked(via = "parent")
        @Receive(Person) public readonly parents: Array<Person>,
        @Linked(via = "children")
        @Receive(Person) public readonly children: Array<Person>
    ) {
    }
    

}

```

input document
```json
[ 
    {
      "common-name": "Haswell",
      "given-name": "Dad"
    },
    {
      "common-name": "Haswell",
      "given-name": "Josiah",
      "parent": "Dad" // generated from commonName property of Identity.  @Linked annotations will correctly link Dad -> Josiah via parent and children properties
    }
]
```

```typescript


@RootElement
class Person {
  @Property(String)
  name: string | undefined;
  @Property({
    type: Address,
    read: {
      alias: "home-addresses",
    },
  })
  addresses: Address[];
}

@RootElement
class Group {
  @Property(Person)
  members: Person[] | undefined;
}
```

### Define a Remotable Object

```typescript
import { Receive, Remotable } from "./remotable";

@Remotable
class RemotableGroup {
  /**
   * @param group the group to construct this from
   */
  constructor(@Receive(Group) group: Group) {}

  addMember(@Receive(Person) member: Person): void {
    this.group.members.push(member); // addMember can be called from the server-side
  }
}

const group = Condensation.newContext().bind(RemotableGroup);
```


