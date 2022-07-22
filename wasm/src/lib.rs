#[macro_use]
extern crate lazy_static;

use parking_lot::Mutex;
use wasm_bindgen::prelude::*;

mod utils;

#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

lazy_static! {
    static ref MUTEX: Mutex<MusicThingy> =
        Mutex::new(MusicThingy::new());
}

// #[wasm_bindgen]
// pub struct PitchSettings {
//     pub scale_range: f32
// }

pub struct MusicThingy {

}

#[wasm_bindgen]
pub fn buffer_alloc(size: usize) -> *mut f32 {
    let mut buf = Vec::<f32>::with_capacity(size);
    let ptr = buf.as_mut_ptr();
    std::mem::forget(buf);
    ptr as *mut f32
}

#[wasm_bindgen]
pub fn process(out_ptr: *mut f32, sample_count: usize) {
    let mut music_thingy = MUTEX.lock();
    music_thingy.process(out_ptr, sample_count);
}

impl MusicThingy {
    pub fn new() -> MusicThingy {
        MusicThingy {}
    }

    pub fn process(&mut self, out_ptr: *mut f32, sample_count: usize) {
        // borrow output buffer from out_ptr pointer.
        let out_buf: &mut [f32] = unsafe {
            std::slice::from_raw_parts_mut(out_ptr, sample_count)
        };

        for i in 0..sample_count {
            // fill f32 sample to output buffer
            out_buf[i] = (i as f32) / (sample_count as f32);
        };
    }
}