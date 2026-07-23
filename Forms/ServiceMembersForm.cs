using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;
using MFC_Youth_Database.Database;
using System.Data.SQLite;

namespace MFC_Youth_Database.Forms
{
    public partial class ServiceMembersForm : Form
    {
        private readonly int serviceID;
        public ServiceMembersForm(int serviceID)
        {
            InitializeComponent();

            this.serviceID = serviceID;

            LoadService();
            LoadMembers();
            FormatDataGridView();

        }
        private void LoadService()
        {
            try
            {
                using (SQLiteConnection conn = DatabaseManager.GetConnection())
                {
                    conn.Open();

                    string query = @"
                        SELECT ServiceName
                        FROM Service
                        WHERE ServiceID = @ServiceID;";

                    SQLiteCommand cmd = new SQLiteCommand(query, conn);

                    cmd.Parameters.AddWithValue(
                        "@ServiceID",
                        serviceID);

                    object result = cmd.ExecuteScalar();

                    if (result != null)
                    {
                        lblService.Text = result.ToString();
                    }
                }
            }
            catch (Exception ex)
            {
                MessageBox.Show(
                    ex.Message,
                    "Database Error",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error);
            }
        }

        private void LoadMembers(string keyword = "")
        {
            try
            {
                using (SQLiteConnection conn = DatabaseManager.GetConnection())
                {
                    conn.Open();
                    string query = @"
SELECT
    md.*
FROM MemberDirectory md
INNER JOIN MemberService ms
    ON md.MemberID = ms.MemberID
WHERE
    ms.ServiceID = @ServiceID
    AND
    (
        `Full Name` LIKE @keyword
        OR Chapter LIKE @keyword
        OR `Contact Number` LIKE @keyword
        OR `Email Address` LIKE @keyword
        OR Address LIKE @keyword
        OR Status LIKE @keyword
    )
ORDER BY `Full Name`;";

                    SQLiteDataAdapter adapter = new SQLiteDataAdapter(query, conn);

                    adapter.SelectCommand.Parameters.AddWithValue(
                        "@ServiceID",
                        serviceID);

                    adapter.SelectCommand.Parameters.AddWithValue(
                        "@keyword",
                        "%" + keyword + "%");

                    DataTable dt = new DataTable();

                    adapter.Fill(dt);

                    dgvMembers.DataSource = dt;


                }
            }
            catch (Exception ex)
            {
                MessageBox.Show(
                    ex.Message,
                    "Database Error",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error);
            }
        }

        private void FormatDataGridView()
        {
            dgvMembers.ReadOnly = true;

            dgvMembers.MultiSelect = false;

            dgvMembers.SelectionMode =
                DataGridViewSelectionMode.FullRowSelect;

            dgvMembers.AllowUserToAddRows = false;

            dgvMembers.AllowUserToDeleteRows = false;

            dgvMembers.AllowUserToResizeRows = false;

            dgvMembers.RowHeadersVisible = false;

            dgvMembers.AutoSizeColumnsMode =
                DataGridViewAutoSizeColumnsMode.Fill;
        }

        private void txtSearch_TextChanged(object sender, EventArgs e)
        {
            LoadMembers(txtSearch.Text.Trim());
        }

        private void btnClose_Click(object sender, EventArgs e)
        {
            this.Close();
        }
    }
}
