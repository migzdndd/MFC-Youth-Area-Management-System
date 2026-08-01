using System;
using System.Data.SQLite;
using System.Windows.Forms;
using MFC_Youth_Database.Utilities;
using MFC_Youth_Database.Database;

namespace MFC_Youth_Database.Forms
{
    public partial class AssignServicesForm : Form
    {
        private readonly int memberID;
        private bool hasChanges = false;
        public AssignServicesForm(int memberID)
        {
            InitializeComponent();

            this.memberID = memberID;

            LoadMember();
            LoadServices();
            LoadAssignedServices();
            hasChanges = false;
        }

        private void LoadMember()
        {
            try
            {
                using (SQLiteConnection conn = DatabaseManager.GetConnection())
                {
                    conn.Open();

                    string query = @"
SELECT
    LastName || ', ' ||
    FirstName ||
    CASE
        WHEN MiddleName IS NULL OR MiddleName = ''
        THEN ''
        ELSE ' ' || MiddleName
    END AS FullName
FROM Member
WHERE MemberID = @MemberID;";

                    SQLiteCommand cmd = new SQLiteCommand(query, conn);

                    cmd.Parameters.AddWithValue("@MemberID", memberID);

                    object result = cmd.ExecuteScalar();

                    if (result != null)
                    {
                        txtMemberName.Text = result.ToString();
                    }
                    else
                    {
                        MessageBox.Show(
                            "The selected member could not be found.",
                            "Information",
                            MessageBoxButtons.OK,
                            MessageBoxIcon.Information);

                        Close();
                    }
                }
            }
            catch (Exception)
            {
                MessageBox.Show(
                    "Unable to load the selected member.",
                    ApplicationConstants.DatabaseErrorTitle,
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error);
            }
        }

        private void LoadServices()
        {
            try
            {
                using (SQLiteConnection conn = DatabaseManager.GetConnection())
                {
                    conn.Open();

                    string query = @"
                SELECT ServiceID, ServiceName
                FROM Service
                ORDER BY ServiceName;";

                    SQLiteCommand cmd = new SQLiteCommand(query, conn);

                    using (SQLiteDataReader reader = cmd.ExecuteReader())
                    {
                        clbServices.Items.Clear();

                        while (reader.Read())
                        {
                            clbServices.Items.Add(new ServiceItem(
                                Convert.ToInt32(reader["ServiceID"]),
                                reader["ServiceName"].ToString()));
                        }
                    }
                }
            }
            catch (Exception)
            {
                MessageBox.Show(
                    "Unable to load the available services.",
                    ApplicationConstants.DatabaseErrorTitle,
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error);
            }
        }

        private void LoadAssignedServices()
        {
            try
            {
                using (SQLiteConnection conn = DatabaseManager.GetConnection())
                {
                    conn.Open();

                    string query = @"
SELECT ServiceID
FROM MemberService
WHERE MemberID = @MemberID;";

                    SQLiteCommand cmd = new SQLiteCommand(query, conn);
                    cmd.Parameters.AddWithValue("@MemberID", memberID);

                    using (SQLiteDataReader reader = cmd.ExecuteReader())
                    {
                        while (reader.Read())
                        {
                            int serviceID = Convert.ToInt32(reader["ServiceID"]);

                            for (int i = 0; i < clbServices.Items.Count; i++)
                            {
                                ServiceItem item = (ServiceItem)clbServices.Items[i];

                                if (item.ServiceID == serviceID)
                                {
                                    clbServices.SetItemChecked(i, true);
                                    break;
                                }
                            }
                        }
                    }
                }
            }
            catch (Exception)
            {
                MessageBox.Show(
                    "Unable to load the assigned services.",
                    ApplicationConstants.DatabaseErrorTitle,
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error);
            }
        }


        private void btnSave_Click(object sender, EventArgs e)
        {
            if (!hasChanges)
            {
                Close();
                return;
            }

            if (clbServices.CheckedItems.Count == 0)
            {
                MessageBox.Show(
                    "Please select at least one service.",
                    "Validation",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Warning);

                clbServices.Focus();
                return;
            }
            try
            {
                using (SQLiteConnection conn = DatabaseManager.GetConnection())
                {
                    conn.Open();

                    SQLiteTransaction transaction =
                        conn.BeginTransaction();

                    try
                    {

                        string deleteQuery = @"
                    DELETE FROM MemberService
                    WHERE MemberID = @MemberID;";

                        SQLiteCommand deleteCmd =
                            new SQLiteCommand(deleteQuery, conn, transaction);

                        deleteCmd.Parameters.AddWithValue("@MemberID", memberID);

                        deleteCmd.ExecuteNonQuery();

                        // Insert checked services
                        string insertQuery = @"
                    INSERT INTO MemberService
                    (MemberID, ServiceID)
                    VALUES
                    (@MemberID, @ServiceID);";

                        foreach (ServiceItem item in clbServices.CheckedItems)
                        {
                            SQLiteCommand insertCmd =
                                new SQLiteCommand(insertQuery, conn, transaction);

                            insertCmd.Parameters.AddWithValue("@MemberID", memberID);
                            insertCmd.Parameters.AddWithValue("@ServiceID", item.ServiceID);

                            insertCmd.ExecuteNonQuery();
                        }

                        transaction.Commit();

                        MessageBox.Show(
                            $"Services for\n\n{txtMemberName.Text}\n\nhave been updated successfully.",
                            "Success",
                            MessageBoxButtons.OK,
                            MessageBoxIcon.Information);

                        hasChanges = false;
                        DialogResult = DialogResult.OK;
                        Close();
                    }
                    catch
                    {
                        transaction.Rollback();
                        throw;
                    }
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show(
                    ex.Message,
                    ApplicationConstants.DatabaseErrorTitle,
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error);
            }
        }

        private void btnCancel_Click(object sender, EventArgs e)
        {
            if (hasChanges)
            {
                DialogResult result = MessageBox.Show(
                    "You have unsaved changes.\n\nClose without saving?",
                    "Unsaved Changes",
                    MessageBoxButtons.YesNo,
                    MessageBoxIcon.Warning);

                if (result == DialogResult.No)
                {
                    return;
                }
            }

            Close();
        }

        private void AssignServicesForm_KeyDown(object sender, KeyEventArgs e)
        {
            // Enter = Save
            if (e.KeyCode == Keys.Enter)
            {
                btnSave.PerformClick();
                e.SuppressKeyPress = true;
            }

            // Escape = Cancel
            else if (e.KeyCode == Keys.Escape)
            {
                btnCancel.PerformClick();
                e.SuppressKeyPress = true;
            }
        }

        private void clbServices_ItemCheck(object sender, ItemCheckEventArgs e)
        {
            hasChanges = true;
        }
    }
}
class ServiceItem
{
    public int ServiceID { get; set; }

    public string ServiceName { get; set; }

    public ServiceItem(int serviceID, string serviceName)
    {
        ServiceID = serviceID;
        ServiceName = serviceName;
    }

    public override string ToString()
    {
        return ServiceName;
    }
}
