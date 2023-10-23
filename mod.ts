// Base component class to extend;
class Component {}

type SuperComponent<T extends Component> = new (...args: any[]) => T;

const ENTITY = Symbol("entity");

export function getEntityID(component: Component): Entity {
  return component[ENTITY];
}

type EntityID = number;

class Entity {
  constructor(id: EntityID, world: World) {
    this.components = new Set<Component>();
    this.id = id;
    this.world = world;
  }
  id: EntityID;
  world: World;
  components: Set<Component>;
  addComponent(component: Component) {
    return this.world.addComponent(this.id, component);
  }
}

export class Registry {
  // Store our entities;
  #entities = new Map<EntityID, Set<Component>>();
  #nextPointer = 0;

  createEntity() {
    const entityID = this.#nextPointer++ as EntityID;
    const entity = new Set<Component>();
    this.#entities.set(entityID, entity);
    return entityID;
  }
  addComponent(
    Entity: EntityID,
    component: Component,
  ): Component {
    const entity = this.#entities.get(Entity);
    if (!entity) {
      throw new Error("Entity does not exist");
    }
    component[ENTITY] = Entity;
    entity.add(component);
    return component;
  }
  getComponents(Entity: EntityID): Set<Component> {
    const entity = this.#entities.get(Entity);
    if (!entity) {
      throw new Error("Entity does not exist");
    }
    return entity;
  }
}

export class World {
  #registry = new Registry();
  #entities = new Map<EntityID, Entity>();

  createEntity(...components: Component[]) {
    const entID = this.#registry.createEntity(...components);
    const ent = new Entity(entID, this);
    this.#entities.set(entID, ent);
    ent.components = this.#registry.getComponents(entID);
    return ent;
  }
  addComponent(
    Entity: EntityID,
    component: Component,
  ): Component {
    return this.#registry.addComponent(Entity, component);
  }
}
