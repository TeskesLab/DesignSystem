use teskeslab_design_system::{Density, Role, Scheme, color, dimensions};

fn luminance(value: teskeslab_design_system::Rgba) -> f64 {
    let channel = |value: u8| {
        let value = f64::from(value) / 255.0;
        if value <= 0.04045 {
            value / 12.92
        } else {
            ((value + 0.055) / 1.055).powf(2.4)
        }
    };
    0.2126 * channel(value.r) + 0.7152 * channel(value.g) + 0.0722 * channel(value.b)
}

#[test]
fn semantic_text_pairs_remain_readable_in_both_schemes() {
    for scheme in [Scheme::Light, Scheme::Dark] {
        for (background, foreground) in [
            (Role::SurfacePage, Role::TextPrimary),
            (Role::SurfaceRaised, Role::TextPrimary),
            (Role::ActionPrimaryBg, Role::ActionPrimaryText),
            (Role::ActionPrimaryHover, Role::ActionPrimaryText),
            (Role::ActionPrimaryPressed, Role::ActionPrimaryText),
            (Role::ActionDangerBg, Role::ActionDangerText),
            (Role::ActionDangerHover, Role::ActionDangerText),
            (Role::ActionDangerPressed, Role::ActionDangerText),
            (Role::StatusSuccessBg, Role::StatusSuccessText),
            (Role::StatusWarningBg, Role::StatusWarningText),
            (Role::StatusDangerBg, Role::StatusDangerText),
            (Role::StatusInfoBg, Role::StatusInfoText),
            (Role::StatusNeutralBg, Role::StatusNeutralText),
            (Role::CodeBg, Role::CodeText),
        ] {
            let a = luminance(color(scheme, background));
            let b = luminance(color(scheme, foreground));
            let contrast = (a.max(b) + 0.05) / (a.min(b) + 0.05);
            assert!(
                contrast >= 4.5,
                "{scheme:?} {background:?}/{foreground:?}: {contrast}"
            );
        }
    }
}

#[test]
fn touch_never_inherits_compact_targets() {
    let comfortable = dimensions(Density::Comfortable, false);
    let compact = dimensions(Density::Compact, false);
    let touch = dimensions(Density::Compact, true);
    assert!(compact.control_height < comfortable.control_height);
    assert!(compact.row_height < comfortable.row_height);
    assert_eq!(touch.control_height, comfortable.control_height);
    assert_eq!(touch.row_height, comfortable.row_height);
    assert_eq!(touch.control_padding_x, comfortable.control_padding_x);
    assert_eq!(touch.control_padding_y, comfortable.control_padding_y);
    assert!(touch.control_height >= 44.0);
}

#[test]
fn semantic_role_names_are_unique_and_colors_are_opaque() {
    for (index, role) in Role::ALL.iter().enumerate() {
        assert!(
            Role::ALL[..index]
                .iter()
                .all(|other| other.name() != role.name())
        );
        for scheme in [Scheme::Light, Scheme::Dark] {
            assert_eq!(color(scheme, *role).a, 255);
        }
    }
}
