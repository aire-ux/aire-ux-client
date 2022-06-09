import {Receive, Remotable, Remote} from "@condensation/remotable";
import {Property, RootElement} from "@condensation/root-element";
import {Condensation} from "@condensation/condensation";
import {Dynamic} from "@condensation/types";
import {customElement, LitElement} from "lit-element";

test("remotable should work with constructor arguments", () => {
  @RootElement
  class TestDTO {
  }

  @Remotable
  class TestReceiver {
    constructor(@Receive(TestDTO) dto: TestDTO) {
    }
  }

  const defs = Condensation.remoteRegistry.resolve(TestReceiver).definitions;

  expect(defs.length).toBe(1);
  expect(defs[0].index).toBe(0);
});

test('remotable should work with subclasses', () => {
  @RootElement
  class TestDTO {
  }

  class Parent {
    id: string | undefined;
  }

  @Remotable
  class TestReceiver extends Parent {
    constructor(@Receive(TestDTO) dto: TestDTO) {
      super();
    }
  }

  const defs = Condensation.remoteRegistry.resolve(TestReceiver).definitions;

  expect(defs.length).toBe(1);
  expect(defs[0].index).toBe(0);
});

test("remotable should allow a value to be constructed", () => {
  @RootElement
  class Person {
    @Property(String)
    name: string | undefined;
  }

  @RootElement
  class Pet {
    @Property(String)
    name: string | undefined;

    @Property(Person)
    momma: Person | undefined;

    sayHenlo(): string {
      return "Mommymommymommy!";
    }
  }

  @Remotable
  @customElement('test-receiver')
  class TestReceiver extends LitElement {
    name: string | undefined;

    constructor(
        @Receive(Pet) public readonly pet: Pet,
        @Receive(Person) public readonly dto: Person
    ) {
      super();
      this.name = dto.name;
    }

    set(@Receive(Person) dto: Person): void {
      console.log(dto);
    }
  }

  const ctx = Condensation.newContext();
  const receiver = ctx.create<TestReceiver>(
      TestReceiver,
      `
  {
    "name": "Flances",
      "momma": {
        "name": "Wab"
      }
  }
  `,
      `{
    "name": "Josiah"
  }`
  );
  expect(receiver.name).toBe("Josiah");
  expect(receiver.dto.name).toBe("Josiah");
  expect(receiver.pet.sayHenlo()).toBe("Mommymommymommy!");
  expect(receiver.pet?.momma?.name).toBe("Wab");
});

test("ensure base use-case works", () => {
  @RootElement
  class GraphConfiguration {
    @Property({
      type: String,
      read: {
        alias: "load-resources",
      },
    })
    loadResources: string | undefined;

    @Property({
      type: Boolean,
      read: {
        alias: "force-includes",
      },
    })
    forceIncludes: string | undefined;

    @Property({
      type: Boolean,
      read: {
        alias: "force-includes",
      },
    })
    loadStylesheets: boolean | undefined;

    @Property({
      type: String,
      read: {
        alias: "resource-extension",
      },
    })
    resourceExtension: boolean | undefined;

    @Property({
      type: Boolean,
      read: {
        alias: "production-mode",
      },
    })
    productionMode: boolean | undefined;

    @Property({
      type: String,
      read: {
        alias: "base-path",
      },
    })
    basePath: string | undefined;
  }

  @Remotable
  class MxGraphManager {
    constructor(
        @Receive(GraphConfiguration) readonly configuration: GraphConfiguration
    ) {
    }
  }

  const mgr = Condensation.newContext().create<MxGraphManager>(
      MxGraphManager,
      `{
      "load-resources": "loading them resources"
  }`
  );
  expect(mgr.configuration?.loadResources).toEqual("loading them resources");
});

test("ensure array is deserializable", () => {
  @RootElement
  class Person {
    @Property(String)
    name: string | undefined;
  }

  @RootElement
  class Group {
    @Property(Person)
    members: Person[] | undefined;
  }

  const group = Condensation.deserializerFor<Group>(Group).read(
      JSON.stringify({
        members: [
          {
            name: "Josiah",
          },
          {
            name: "Lisa",
          },
          {
            name: "Alejandro",
          },

          {
            name: "Tiff",
          },

        ]
      })
  );

  expect(group.members?.length).toBe(4);
  expect(group.members?.map((m) => m.name)).toEqual([
    "Josiah",
    "Lisa",
    "Alejandro",
    "Tiff",
  ]);
});

test("pointers should be invocable", () => {
  @RootElement
  class Person {
    @Property(String)
    name: string | undefined;
  }

  @Remotable
  class MxGraphManager {
    person: Person | undefined;

    public init(@Receive(Person) person: Person): void {
      this.person = person;
    }
  }

  const ctx = Condensation.newContext(),
      mgr = ctx.create<MxGraphManager>(MxGraphManager);

  ctx.invoke(
      mgr,
      "init",
      `
    {
      "name": "Josiah"
    }
  `
  );

  expect(mgr.person?.name).toBe("Josiah");
});


test("values should be invocable", () => {
  @RootElement
  class Person {
    @Property(String)
    name: string | undefined;
  }

  @Remotable
  class MxGraphManager {
    person: Person | undefined;

    @Remote
    public init(@Receive(Person) person: Person): void {
      this.person = person;
    }
  }

  const mgr = new MxGraphManager();
  mgr.init(`{
    "name": "Josiah"
    }
  ` as any);
  expect(mgr?.person?.name).toBe("Josiah");

});

test('canvas scenario should work', () => {
  @RootElement
  class Vertex {


    @Property(Number)
    private x: number | undefined;

    @Property(Number)
    private y: number | undefined;

    @Property(Number)
    private width: number | undefined;

    @Property(Number)
    private height: number | undefined;

    @Property(String)
    label: string | undefined;
  }

  @Remotable
  @customElement('aire-canvas')
  class Canvas extends LitElement {
    readonly vertices: Vertex[];

    constructor() {
      super();
      this.vertices = [];
    }


    @Remote
    public addVertex(@Receive(Vertex) vertex: Vertex) {
      this.vertices.push(vertex);
      // this.graph?.addNode(vertex as any);
    }
  }

  const canvas = new Canvas();
  expect(canvas.vertices).toBeTruthy();
  // @ts-ignore
  canvas.addVertex(`
  {
    "x": null,
    "y": null,
    "label": "hello",
    "width": null,
    "height": null
  }
  `);
  expect(canvas.vertices.length).toBe(1);
  const vertex = canvas.vertices[0];
  expect(vertex.label).toBe("hello");
});

test('parsing json to a type should work', () => {

  type Whatever = {
    hello: string
  };

  @Remotable
  class Test {
    readonly whatevers: Whatever[] = [];

    @Remote
    add(@Receive(Dynamic) whatever: Whatever): void {
      this.whatevers.push(whatever)
    }
  }

  let a = new Test();
  // @ts-ignore
  a.add(`
    {"hello": "world"}
  `);

  expect(a.whatevers.length).toBe(1);
  expect(a.whatevers[0].hello).toBe("world");
});


test('parsing json to a list type should work', () => {

  type Whatever = {
    hello: string
  };

  @Remotable
  class Test {
    readonly whatevers: Whatever[] = [];

    @Remote
    add(@Receive(Dynamic) whatever: Whatever[]): void {
      this.whatevers.push(...whatever)
    }
  }

  let a = new Test();
  // @ts-ignore
  a.add(`[
    {"hello": "world"},
    {"hello": "jorld"}
    ]
  `);

  expect(a.whatevers.length).toBe(2);
  expect(a.whatevers[0].hello).toBe("world");
  expect(a.whatevers[1].hello).toBe("jorld");
});

test('add all should work', () => {
  @RootElement
  class Vertex {


    @Property(Number)
    private x: number | undefined;

    @Property(Number)
    private y: number | undefined;

    @Property(Number)
    private width: number | undefined;

    @Property(Number)
    private height: number | undefined;

    @Property(String)
    label: string | undefined;
  }

  @Remotable
  @customElement('aire-canvas2')
  class Canvas extends LitElement {
    readonly vertices: Vertex[];

    constructor() {
      super();
      this.vertices = [];
    }


    @Remote
    public addVertex(@Receive(Vertex) vertex: Vertex) {
      this.vertices.push(vertex);
      // this.graph?.addNode(vertex as any);
    }

    @Remote
    public addVertices(@Receive(Vertex) vertex: Vertex[]) {
      this.vertices.push(...vertex);
      // this.graph?.addNode(vertex as any);
    }
  }

  const canvas = new Canvas();
  expect(canvas.vertices).toBeTruthy();
  // @ts-ignore
  canvas.addVertices(`
  [{
    "x": null,
    "y": null,
    "label": "hello",
    "width": null,
    "height": null
  },
  
  {
    "x": null,
    "y": null,
    "label": "jello",
    "width": null,
    "height": null
  }]
  `);
  expect(canvas.vertices.length).toBe(2);
  let vertex = canvas.vertices[0];
  expect(vertex.label).toBe("hello");
  vertex = canvas.vertices[1];
  expect(vertex.label).toBe("jello");
});


