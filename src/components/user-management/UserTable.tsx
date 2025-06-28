import { Table } from '../ui/table';
import Badge from '../ui/badge/Badge';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
}

interface UserTableProps {
  users: User[];
}

export function UserTable({ users }: UserTableProps) {
  return (
    <Table>
      <thead>
        <tr>
          <th className="w-1/4">Name</th>
          <th className="w-1/4">Email</th>
          <th className="w-1/4">Role</th>
          <th className="w-1/4">Status</th>
        </tr>
      </thead>
      <tbody>
        {users.map((user) => (
          <tr key={user.id}>
            <td>{user.name}</td>
            <td>{user.email}</td>
            <td>{user.role}</td>
            <td>
              <Badge
                variant="light"
                color={user.status === 'Active' ? 'success' : 'error'}
              >
                {user.status}
              </Badge>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}
