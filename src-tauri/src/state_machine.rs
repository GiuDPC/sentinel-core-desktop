use std::collections::HashMap;

pub fn valid_transitions() -> HashMap<&'static str, Vec<&'static str>> {
    HashMap::from([
        ("OPEN", vec!["ASSIGNED"]),
        ("ASSIGNED", vec!["IN_PROGRESS"]),
        ("IN_PROGRESS", vec!["ON_HOLD", "RESOLVED"]),
        ("ON_HOLD", vec!["IN_PROGRESS"]),
        ("RESOLVED", vec!["AWAITING_CONFIRMATION"]),
        ("AWAITING_CONFIRMATION", vec!["CLOSED", "IN_PROGRESS"]),
        ("CLOSED", vec![]),
    ])
}

pub fn is_valid_transition(current: &str, next: &str) -> bool {
    valid_transitions()
        .get(current)
        .is_some_and(|allowed| allowed.contains(&next))
}
