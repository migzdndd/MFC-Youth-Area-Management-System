using System;
using System.Data;
using System.Data.SQLite;
using System.Windows.Forms;
using MFC_Youth_Database.Database;

namespace MFC_Youth_Area_Management_System.Forms
{
    public partial class GIGTrackerForm : Form
    {

        private readonly int memberID;
        public GIGTrackerForm(int memberID)
        {
            InitializeComponent();

            this.memberID = memberID;

            LoadMember();
            LoadTotalContribution();
            FormatDataGridView();
            LoadContributions();
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

                    cmd.Parameters.AddWithValue(
                        "@MemberID",
                        memberID);

                    object result = cmd.ExecuteScalar();

                    if (result != null)
                    {
                        lblMemberName.Text = result.ToString();
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

        private void LoadTotalContribution()
        {
            try
            {
                using (SQLiteConnection conn = DatabaseManager.GetConnection())
                {
                    conn.Open();

                    string query = @"
                    SELECT
                        IFNULL(SUM(Amount), 0)
                    FROM GIGContribution
                    WHERE MemberID = @MemberID;";

                    SQLiteCommand cmd = new SQLiteCommand(query, conn);

                    cmd.Parameters.AddWithValue(
                        "@MemberID",
                        memberID);

                    object result = cmd.ExecuteScalar();

                    decimal total =
                        Convert.ToDecimal(result);

                    lblTotalAmount.Text = "₱" + total.ToString("N2");
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

        private void LoadContributions(string keyword = "")
        {
            try
            {
                using (SQLiteConnection conn = DatabaseManager.GetConnection())
                {
                    conn.Open();

                    string query = @"
                    SELECT
                        ContributionID,
                        ContributionDate AS 'Date',
                        Amount,
                        IFNULL(Remarks, '') AS Remarks
                    FROM GIGContribution
                    WHERE
                        MemberID = @MemberID
                        AND
                        (
                            ContributionDate LIKE @keyword
                            OR Remarks LIKE @keyword
                        )
                    ORDER BY
                        ContributionDate DESC,
                        ContributionID DESC;";

                    SQLiteDataAdapter adapter =
                        new SQLiteDataAdapter(query, conn);

                    adapter.SelectCommand.Parameters.AddWithValue(
                        "@MemberID",
                        memberID);

                    adapter.SelectCommand.Parameters.AddWithValue(
                        "@keyword",
                        "%" + keyword + "%");

                    DataTable dt = new DataTable();

                    adapter.Fill(dt);

                    dgvContributions.DataSource = dt;

                    if (dgvContributions.Columns.Contains("ContributionID"))
                    {
                        dgvContributions.Columns["ContributionID"].Visible = false;
                    }

                    dgvContributions.Columns["Date"].FillWeight = 100;
                    dgvContributions.Columns["Amount"].FillWeight = 80;
                    dgvContributions.Columns["Remarks"].FillWeight = 220;

                    dgvContributions.Columns["Amount"].DefaultCellStyle.Format = "N2";
                    dgvContributions.Columns["Amount"].DefaultCellStyle.Alignment =
                        DataGridViewContentAlignment.MiddleRight;

                    dgvContributions.Columns["Amount"].HeaderCell.Style.Alignment =
                        DataGridViewContentAlignment.MiddleRight;
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
            dgvContributions.ReadOnly = true;

            dgvContributions.MultiSelect = false;

            dgvContributions.SelectionMode =
                DataGridViewSelectionMode.FullRowSelect;

            dgvContributions.AllowUserToAddRows = false;

            dgvContributions.AllowUserToDeleteRows = false;

            dgvContributions.AllowUserToResizeRows = false;

            dgvContributions.RowHeadersVisible = false;

            dgvContributions.BackgroundColor =
                System.Drawing.Color.White;

            dgvContributions.BorderStyle =
                BorderStyle.None;

            dgvContributions.AutoSizeColumnsMode =
                DataGridViewAutoSizeColumnsMode.Fill;
        }

        private void RefreshData()
        {
            LoadTotalContribution();
            LoadContributions();
        }

        private void btnAdd_Click(object sender, EventArgs e)
        {
            using (AddGIGContributionForm addContributionForm =
                new AddGIGContributionForm(memberID))
            {
                if (addContributionForm.ShowDialog() == DialogResult.OK)
                {
                    RefreshData();
                }
            }
        }

        private void btnRefresh_Click(object sender, EventArgs e)
        {
            RefreshData();
        }

        private void btnClose_Click(object sender, EventArgs e)
        {
            Close();
        }

        private void GIGTrackerForm_KeyDown(object sender, KeyEventArgs e)
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

            else if (e.KeyCode == Keys.Escape)
            {
                btnClose.PerformClick();
                e.SuppressKeyPress = true;
            }
        }

        private void btnEdit_Click(object sender, EventArgs e)
        {
            if (dgvContributions.CurrentRow == null)
            {
                MessageBox.Show(
                    "Please select a contribution to edit.",
                    "No Selection",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Warning);

                return;
            }

            int contributionID = Convert.ToInt32(
                dgvContributions.CurrentRow.Cells["ContributionID"].Value);

            using (EditGIGContributionForm editForm =
                new EditGIGContributionForm(contributionID, memberID))
            {
                if (editForm.ShowDialog() == DialogResult.OK)
                {
                    RefreshData();
                }
            }
        }

        private void btnDelete_Click(object sender, EventArgs e)
        {
            if (dgvContributions.CurrentRow == null)
            {
                MessageBox.Show(
                    "Please select a contribution to delete.",
                    "No Selection",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Warning);

                return;
            }

            string contributionDate =
                dgvContributions.CurrentRow.Cells["Date"].Value.ToString();

            decimal amount =
                Convert.ToDecimal(
                    dgvContributions.CurrentRow.Cells["Amount"].Value);

            DialogResult result = MessageBox.Show(
                $"Delete this contribution?\n\n" +
                $"Date: {contributionDate}\n" +
                $"Amount: ₱{amount:N2}\n\n" +
                $"This action cannot be undone.",
                "Confirm Delete",
                MessageBoxButtons.YesNo,
                MessageBoxIcon.Warning);

            if (result != DialogResult.Yes)
            {
                return;
            }

            try
            {
                using (SQLiteConnection conn = DatabaseManager.GetConnection())
                {
                    conn.Open();

                    string query = @"
            DELETE FROM GIGContribution
            WHERE ContributionID = @ContributionID;";

                    SQLiteCommand cmd = new SQLiteCommand(query, conn);

                    cmd.Parameters.AddWithValue(
                        "@ContributionID",
                        dgvContributions.CurrentRow.Cells["ContributionID"].Value);

                    cmd.ExecuteNonQuery();
                }

                MessageBox.Show(
                    "Contribution deleted successfully.",
                    "Success",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Information);

                RefreshData();
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
    }
}
