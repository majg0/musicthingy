use std::collections::{BTreeMap, HashSet};

use named::Named;
use serde::{Deserialize, Serialize};

#[derive(Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Debug, Hash)]
pub struct EntityId(u16);

#[derive(Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Debug, Hash, Serialize)]
pub struct TypeId(usize);

#[derive(Clone, PartialEq, Debug, Hash, Serialize)]
pub struct Type {
    id: TypeId,
    size: usize,
    name: &'static str,
}

#[derive(Clone, PartialEq, Eq, Debug)]
pub struct Value(Vec<u8>);

pub struct Ecs {
    next_id: EntityId,
    pub types: Vec<Type>,
    type_ids: BTreeMap<&'static str, TypeId>,
    data: BTreeMap<TypeId, BTreeMap<EntityId, Value>>,
    entity_types: BTreeMap<EntityId, HashSet<TypeId>>,
}

impl Ecs {
    pub fn new() -> Self {
        Self {
            next_id: EntityId(0),
            types: Vec::new(),
            type_ids: BTreeMap::new(),
            data: BTreeMap::new(),
            entity_types: BTreeMap::new(),
        }
    }

    pub fn create_id(&mut self) -> EntityId {
        let id = self.next_id;
        self.next_id = EntityId(id.0 + 1);
        id
    }

    pub fn type_id<T: Named>(&mut self) -> TypeId {
        if let Some(id) = self.type_ids.get(&T::name()) {
            *id
        } else {
            let id = TypeId(self.types.len());
            let name = T::name();
            self.type_ids.insert(name, id);

            self.types.push(Type {
                id,
                size: std::mem::size_of::<T>(),
                name,
            });
            id
        }
    }

    pub fn store<'a, T: Sized + Named + Serialize + Deserialize<'a>>(
        &'a mut self,
        id: EntityId,
        v: &T,
    ) {
        let t = self.type_id::<T>();
        self.entity_types.entry(id).or_default().insert(t);
        let mut vec = Vec::with_capacity(std::mem::size_of::<T>());

        unsafe {
            std::ptr::copy_nonoverlapping(
                (v as *const T) as *const u8,
                vec.as_mut_ptr(),
                std::mem::size_of::<T>(),
            );
        }

        self.data.entry(t).or_default().insert(id, Value(vec));
    }

    pub fn update<'a, T: 'a + Sized + Named + Serialize + Deserialize<'a>>(
        &'a mut self,
        id: EntityId,
        f: impl FnOnce(&'a mut T) -> (),
    ) {
        let t = self.type_id::<T>();
        let x = self.data.get_mut(&t).and_then(|x| x.get_mut(&id)).unwrap();
        unsafe {
            f(std::mem::transmute(x.0.as_mut_ptr()));
        }
    }

    pub fn get<'a, T: Named + Serialize + Deserialize<'a>>(&'a self, id: EntityId) -> Option<&T> {
        let t = self.type_ids.get(&T::name()).unwrap();
        // let t = self.type_id::<T>();
        self.data
            .get(t)
            .and_then(|x| x.get(&id))
            .and_then(|x| Some(unsafe { std::mem::transmute(x.0.as_ptr()) }))
    }
}

mod tests {
    use named::Named;
    use named_derive::Named;
    use serde::{Deserialize, Serialize};

    #[derive(Serialize, Deserialize, PartialEq, Debug, Named)]
    struct Foo {
        a: f32,
        b: f32,
    }

    #[test]
    fn set_get() {
        let mut ecs = super::Ecs::new();

        let a = ecs.create_id();

        let foo = Foo { a: 0.1, b: 1. };

        ecs.store(a, &foo);

        // {
            let stored: &Foo = ecs.get(a).unwrap();
            assert_eq!(foo, *stored);
        // }

        // BOOM

        ecs.update(a, |x: &mut Foo| x.a += 1.);
        {
            let stored: &Foo = ecs.get(a).unwrap();
            assert_ne!(foo, *stored);
        }
    }
}
