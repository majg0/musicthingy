use ecs::{Ecs, EntityId};
use named::Named;
use named_derive::Named;
use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

mod ecs;
mod utils;

#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

static mut INSTANCE: Option<MusicThingy> = None;

trait TypeInfo {}

#[derive(Serialize, Deserialize, Named)]
struct PitchSpace {
    scale_range: f32,
    scale_subdivisions: f32,
    standard_frequency: f32,
    standard_pitch_index: f32,
}

impl PitchSpace {
    fn pitch_frequency(&self, pitch_index: f32) -> f32 {
        self.standard_frequency
            * self
                .scale_range
                .powf((pitch_index - self.standard_pitch_index) / self.scale_subdivisions)
    }
}

#[derive(Serialize, Deserialize, Named)]
struct Player {
    playback_speed: f32,
    volume: f32,
    time_abs: f32,
    time_rel: f32,
}

pub struct MusicThingy {
    sample_rate: f32,
    buf: Vec<f32>,
    phase: f32,
    ecs: Ecs,
    id: EntityId,
}

impl MusicThingy {
    pub fn new(sample_rate: u32, buffer_size: usize) -> MusicThingy {
        let mut ecs = Ecs::new();

        let id = ecs.create_id();

        ecs.store(
            id,
            &PitchSpace {
                scale_range: 2.,
                scale_subdivisions: 12.,
                standard_frequency: 440.,
                standard_pitch_index: 69.,
            },
        );
        ecs.store(
            id,
            &Player {
                playback_speed: 1.,
                volume: 0.5,
                time_abs: 0.,
                time_rel: 0.,
            },
        );

        MusicThingy {
            sample_rate: sample_rate as f32,
            buf: vec![0.; buffer_size],
            id,
            ecs,
            phase: 0.,
        }
    }

    pub fn process(&mut self) {
        let n = self.buf.len();

        let ps: &PitchSpace = self.ecs.get(self.id).unwrap();
        let p: &Player = self.ecs.get(self.id).unwrap();

        let frequency = ps.pitch_frequency(69.);

        for i in 0..n {
            self.phase =
                (self.phase + p.playback_speed * frequency / self.sample_rate).rem_euclid(1.0);
            self.buf[i] = p.volume * (self.phase * std::f32::consts::TAU).sin();
        }

        let time_step_abs = n as f32 / self.sample_rate;
        let time_step_rel = p.playback_speed * time_step_abs;
    }
}

fn instance() -> &'static mut MusicThingy {
    unsafe { INSTANCE.as_mut().expect("call initialize first") }
}

#[wasm_bindgen]
pub fn initialize(sample_rate: u32, buffer_size: usize) -> *const f32 {
    unsafe {
        INSTANCE = Some(MusicThingy::new(sample_rate, buffer_size));
    }
    instance().buf.as_ptr()
}

#[wasm_bindgen]
pub fn process() {
    instance().process();
}

#[wasm_bindgen(js_name = getSettings)]
pub fn get_settings() -> JsValue {
    JsValue::from_serde(&instance().ecs.types).unwrap()
}

////////////////////////
