import { useEffect, useState } from 'react';

const ShowUsers = () => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/auth/show-users');
        const data = await response.json();
        if (data.status === 'success') {
          setUsers(data.data.users);
        } else {
          console.error('Failed to fetch users');
        }
      } catch (error) {
        console.error('Error:', error);
      }
    };

    fetchUsers();
  }, []);

  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold text-center mb-8">User List</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((user) => (
          <div key={user._id} className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold">{user.name}</h2>
            <p className="text-gray-600">Email: {user.email}</p>
            <p className="text-gray-600">Age: {user.age}</p>
            <p className="text-gray-600">Gender: {user.gender}</p>
            <div className="mt-4">
              <h3 className="font-semibold">Hobbies:</h3>
              <ul className="list-disc list-inside">
                {Object.values(user.hobbies).map((hobby, index) => (
                  <li key={index} className="text-gray-600">
                    {hobby}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ShowUsers;
