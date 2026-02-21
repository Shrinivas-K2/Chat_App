export function GroupSidebar({ groups, onCreateGroup, onDeleteGroup }) {
  return (
    <aside className="group-sidebar">
      <div className="group-sidebar-head">
        <h3>Groups</h3>
        <button onClick={onCreateGroup} className="mini-btn">+ New</button>
      </div>
      <div className="group-items">
        {groups.map((group) => (
          <div key={group.id} className="group-item">
            <span>{group.title}</span>
            <button className="delete-btn" onClick={() => onDeleteGroup(group.id)}>Delete</button>
          </div>
        ))}
      </div>
    </aside>
  );
}
