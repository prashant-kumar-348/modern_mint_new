const fs = require('fs');
let content = fs.readFileSync('backend/src/services/lobby.service.ts', 'utf8');

const target1 = `    // Already in room, allow proceeding/reconnecting without error
    return;`.replace(/\n/g, '\r\n');

const replace1 = `    // Already in room (e.g. host updating role/avatar on Character Select screen)
    await client.query(
      \`UPDATE room_players
       SET role=$1, avatar_id=$2, display_name=$3
       WHERE room_id=$4 AND user_id=$5\`,
      [role, avatar_id, display_name.trim(), roomId, userId]
    );
    return;`.replace(/\n/g, '\r\n');

if (!content.includes(target1)) {
  console.error('Target 1 not found!');
  process.exit(1);
}
content = content.replace(target1, replace1);

const target2 = `    // Password rooms must be joined through the password endpoint
    if (room.privacy === "password") {
      throw { status: 403, message: "This room requires a password." };
    }`.replace(/\n/g, '\r\n');

const replace2 = `    // Password rooms must be joined through the password endpoint (unless host)
    if (room.privacy === "password" && room.host_user_id !== userId) {
      throw { status: 403, message: "This room requires a password." };
    }`.replace(/\n/g, '\r\n');

if (!content.includes(target2)) {
  console.error('Target 2 not found!');
  process.exit(1);
}
content = content.replace(target2, replace2);

fs.writeFileSync('backend/src/services/lobby.service.ts', content, 'utf8');
console.log('Successfully updated lobby.service.ts!');
