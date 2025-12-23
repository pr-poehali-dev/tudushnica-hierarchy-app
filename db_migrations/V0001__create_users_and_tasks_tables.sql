CREATE TABLE IF NOT EXISTS t_p2433582_tudushnica_hierarchy.users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS t_p2433582_tudushnica_hierarchy.tasks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES t_p2433582_tudushnica_hierarchy.users(id),
    task_data JSONB NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON t_p2433582_tudushnica_hierarchy.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_updated_at ON t_p2433582_tudushnica_hierarchy.tasks(updated_at);
