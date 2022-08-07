use proc_macro::TokenStream;
use quote::quote;
use syn;

#[proc_macro_derive(Named)]
pub fn named_derive(input: TokenStream) -> TokenStream {
    impl_named(&syn::parse(input).unwrap())
}

fn impl_named(ast: &syn::DeriveInput) -> TokenStream {
    let name = &ast.ident;
    let gen = quote! {
        impl Named for #name {
            fn name() -> &'static str {
                stringify!(#name)
            }
        }
    };
    gen.into()
}
