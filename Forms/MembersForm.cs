using System;
using System.Data;
using System.Windows.Forms;
using System.Data.SQLite;
using MFC_Youth_Database.Database;

namespace MFC_Youth_Database.Forms
{
    public partial class MembersForm : Form
    {
        public bool IsEmbedded { get; set; } = false;
        public MembersForm()
        {
            InitializeComponent();
            LoadMembers();
        }

        private void LoadMembers(string keyword = "")
        {
            try
            {
                using (SQLiteConnection conn = DatabaseManager.GetConnection())
                {
                    conn.Open();

                    string query = @"
                        SELECT *
                        FROM MemberDirectory
                        WHERE
                            `Full Name` LIKE @keyword
                            OR Chapter LIKE @keyword
                            OR `Contact Number` LIKE @keyword
                            OR `Email Address` LIKE @keyword
                            OR Address LIKE @keyword
                            OR Status LIKE @keyword
                            OR Services LIKE @keyword
                    ORDER BY `Full Name`;";

                    SQLiteDataAdapter adapter =
                        new SQLiteDataAdapter(query, conn);
                    adapter.SelectCommand.Parameters.AddWithValue("@keyword", "%" + keyword + "%");

                    DataTable dt = new DataTable();
                    adapter.Fill(dt);

                    dgvMembers.DataSource = dt;
                    FormatDataGridView();
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

            if (dgvMembers.Columns.Contains("MemberID"))
            {
                dgvMembers.Columns["MemberID"].Visible = false;
            }


            dgvMembers.ReadOnly = true;
            dgvMembers.MultiSelect = false;
            dgvMembers.SelectionMode = DataGridViewSelectionMode.FullRowSelect;

            dgvMembers.AllowUserToAddRows = false;
            dgvMembers.AllowUserToDeleteRows = false;
            dgvMembers.AllowUserToResizeRows = false;

            dgvMembers.RowHeadersVisible = false;
            dgvMembers.AutoSizeColumnsMode = DataGridViewAutoSizeColumnsMode.Fill;


            dgvMembers.Columns["Full Name"].FillWeight = 180;
            dgvMembers.Columns["Chapter"].FillWeight = 80;

            if (dgvMembers.Columns.Contains("Age"))
            {
                dgvMembers.Columns["Age"].FillWeight = 45;

                dgvMembers.Columns["Age"].DefaultCellStyle.Alignment =
                    DataGridViewContentAlignment.MiddleCenter;

                dgvMembers.Columns["Age"].HeaderCell.Style.Alignment =
                    DataGridViewContentAlignment.MiddleCenter;
            }

            dgvMembers.Columns["Date of Birth"].FillWeight = 90;
            dgvMembers.Columns["Contact Number"].FillWeight = 110;
            dgvMembers.Columns["Email Address"].FillWeight = 180;
            dgvMembers.Columns["Address"].FillWeight = 220;
            dgvMembers.Columns["Status"].FillWeight = 70;
            dgvMembers.Columns["Services"].FillWeight = 180;

            dgvMembers.Columns["Chapter"].DefaultCellStyle.Alignment =
                DataGridViewContentAlignment.MiddleCenter;

            dgvMembers.Columns["Status"].DefaultCellStyle.Alignment =
                DataGridViewContentAlignment.MiddleCenter;
            dgvMembers.Columns["Chapter"].HeaderCell.Style.Alignment =
                DataGridViewContentAlignment.MiddleCenter;

            dgvMembers.Columns["Status"].HeaderCell.Style.Alignment =
                DataGridViewContentAlignment.MiddleCenter;
        }

        private void MembersForm_Shown(object sender, EventArgs e)
        {
            if (!IsEmbedded)
                return;

            pnlHeader.Visible = false;
            pnlFooter.Visible = false;
        }

        private void btnRefresh_Click(object sender, EventArgs e)
        {
            txtSearch.Clear();
            LoadMembers();
        }

        private void txtSearch_TextChanged(object sender, EventArgs e)
        {
            LoadMembers(txtSearch.Text.Trim());
        }

        private void btnAdd_Click(object sender, EventArgs e)
        {
            using (AddMemberForm addMemberForm = new AddMemberForm())
            {
                if (addMemberForm.ShowDialog() == DialogResult.OK)
                {
                    LoadMembers();
                }
            }
        }

        private void btnEdit_Click(object sender, EventArgs e)
        {
            if (dgvMembers.CurrentRow == null)
            {
                MessageBox.Show(
                    "Please select a member to edit.",
                    "No Selection",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Warning);

                return;
            }

            int memberID = Convert.ToInt32(
                dgvMembers.CurrentRow.Cells["MemberID"].Value);

            using (EditMemberForm editMemberForm = new EditMemberForm(memberID))
            {
                if (editMemberForm.ShowDialog() == DialogResult.OK)
                {
                    LoadMembers();
                }
            }
        }

        private void btnDelete_Click(object sender, EventArgs e)
        {
            if (dgvMembers.CurrentRow == null)
            {
                MessageBox.Show(
                    "Please select a member to delete.",
                    "No Selection",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Warning);

                return;
            }

            string memberName =
                dgvMembers.CurrentRow.Cells["Full Name"].Value.ToString();

            string chapter =
                dgvMembers.CurrentRow.Cells["Chapter"].Value.ToString();

            string status =
                dgvMembers.CurrentRow.Cells["Status"].Value.ToString();

            DialogResult result = MessageBox.Show(
                $"Are you sure you want to delete this member?\n\n" +
                $"Name: {memberName}\n" +
                $"Chapter: {chapter}\n\n" +
                $"This action cannot be undone.",
                "Confirm Delete",
                MessageBoxButtons.YesNo,
                MessageBoxIcon.Question);

            if (result != DialogResult.Yes)
            {
                return;
            }

            try
            {
                int memberID = Convert.ToInt32(
                    dgvMembers.CurrentRow.Cells["MemberID"].Value);

                using (SQLiteConnection conn = DatabaseManager.GetConnection())
                {
                    conn.Open();

                    string query = @"
            DELETE FROM Member
            WHERE MemberID = @MemberID;";

                    SQLiteCommand cmd =
                        new SQLiteCommand(query, conn);

                    cmd.Parameters.AddWithValue("@MemberID", memberID);

                    int rowsAffected = cmd.ExecuteNonQuery();

                    if (rowsAffected > 0)
                    {
                        MessageBox.Show(
                            "Member deleted successfully.",
                            "Success",
                            MessageBoxButtons.OK,
                            MessageBoxIcon.Information);

                        LoadMembers();
                    }
                    else
                    {
                        MessageBox.Show(
                            "The selected member could not be found.",
                            "Information",
                            MessageBoxButtons.OK,
                            MessageBoxIcon.Information);
                    }
                }
            }
            catch (SQLiteException)
            {
                MessageBox.Show(
                    "Unable to delete the selected member.\n\nPlease try again.",
                    "Database Error",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error);
            }
            catch (Exception)
            {
                MessageBox.Show(
                    "An unexpected error occurred.\n\nPlease try again.",
                    "Error",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error);
            }
        }

        private void dgvMembers_CellDoubleClick(object sender, DataGridViewCellEventArgs e)
        {
            if (e.RowIndex >= 0)
            {
                btnEdit_Click(sender, EventArgs.Empty);
            }
        }

        private void MembersForm_KeyDown(object sender, KeyEventArgs e)
        {
            if (e.Control && e.KeyCode == Keys.N)
            {
                btnAdd.PerformClick();
                e.SuppressKeyPress = true;
            }

            else if (e.KeyCode == Keys.F5)
            {
                btnRefresh.PerformClick();
                e.SuppressKeyPress = true;
            }

            else if (e.KeyCode == Keys.Enter)
            {
                btnEdit.PerformClick();
                e.SuppressKeyPress = true;
            }

            else if (e.KeyCode == Keys.Delete)
            {
                btnDelete.PerformClick();
                e.SuppressKeyPress = true;
            }
        }

        private void tsmiEdit_Click(object sender, EventArgs e)
        {
            btnEdit.PerformClick();
        }

        private void tsmiDelete_Click(object sender, EventArgs e)
        {
            btnDelete.PerformClick();
        }

        private void tsmirefresh_Click(object sender, EventArgs e)
        {
            btnRefresh.PerformClick();
        }

        private void dgvMembers_CellMouseDown(object sender, DataGridViewCellMouseEventArgs e)
        {
            if (e.RowIndex >= 0 && e.Button == MouseButtons.Right)
            {
                dgvMembers.ClearSelection();

                dgvMembers.Rows[e.RowIndex].Selected = true;

                dgvMembers.CurrentCell =
                    dgvMembers.Rows[e.RowIndex].Cells[0];
            }
        }

        private void btnAssignServices_Click(object sender, EventArgs e)
        {
            if (dgvMembers.CurrentRow == null)
            {
                MessageBox.Show(
                    "Please select a member first.",
                    "No Selection",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Warning);

                return;
            }

            int memberID = Convert.ToInt32(
                dgvMembers.CurrentRow.Cells["MemberID"].Value);

            using (AssignServicesForm assignServicesForm =
                new AssignServicesForm(memberID))
            {
    if (assignServicesForm.ShowDialog() == DialogResult.OK)
    {
        LoadMembers();
    }
            }
        }

        private void btnBack_Click(object sender, EventArgs e)
        {
            if (this.ParentForm is Dashboard dashboard)
            {
                dashboard.ShowHome();
            }
        }

        private void dgvMembers_CellContentClick(object sender, DataGridViewCellEventArgs e)
        {

        }
    }
}