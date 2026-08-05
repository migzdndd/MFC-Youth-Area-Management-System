using System;
using System.Data.SQLite;
using System.Windows.Forms;
using MFC_Youth_Database.Database;

namespace MFC_Youth_Area_Management_System.Forms
{
    public partial class EditGIGContributionForm : Form
    {
        private readonly int contributionID;
        private readonly int memberID;

        public EditGIGContributionForm(int contributionID, int memberID)
        {
            InitializeComponent();

            this.contributionID = contributionID;
            this.memberID = memberID;

            LoadContribution();
        }

        private void LoadContribution()
        {
            try
            {
                using (SQLiteConnection conn = DatabaseManager.GetConnection())
                {
                    conn.Open();

                    string query = @"
            SELECT
                ContributionDate,
                Amount,
                Remarks
            FROM GIGContribution
            WHERE ContributionID = @ContributionID;";

                    SQLiteCommand cmd = new SQLiteCommand(query, conn);

                    cmd.Parameters.AddWithValue(
                        "@ContributionID",
                        contributionID);

                    SQLiteDataReader reader = cmd.ExecuteReader();

                    if (reader.Read())
                    {
                        dtpContributionDate.Value =
                            Convert.ToDateTime(reader["ContributionDate"]);

                        txtAmount.Text =
                            reader["Amount"].ToString();

                        txtRemarks.Text =
                            reader["Remarks"].ToString();
                    }

                    reader.Close();
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

        private bool ValidateInputs()
        {
            if (string.IsNullOrWhiteSpace(txtAmount.Text))
            {
                MessageBox.Show(
                    "Amount is required.",
                    "Validation",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Warning);

                txtAmount.Focus();

                return false;
            }

            if (!decimal.TryParse(txtAmount.Text, out decimal amount))
            {
                MessageBox.Show(
                    "Please enter a valid amount.",
                    "Validation",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Warning);

                txtAmount.Focus();

                return false;
            }

            if (amount <= 0)
            {
                MessageBox.Show(
                    "Amount must be greater than zero.",
                    "Validation",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Warning);

                txtAmount.Focus();

                return false;
            }

            return true;
        }

        private void btnUpdate_Click(object sender, EventArgs e)
        {
            if (!ValidateInputs())
            {
                return;
            }

            try
            {
                using (SQLiteConnection conn = DatabaseManager.GetConnection())
                {
                    conn.Open();

                    string query = @"
            UPDATE GIGContribution
            SET
                ContributionDate = @ContributionDate,
                Amount = @Amount,
                Remarks = @Remarks
            WHERE ContributionID = @ContributionID;";

                    SQLiteCommand cmd = new SQLiteCommand(query, conn);

                    cmd.Parameters.AddWithValue(
                        "@ContributionDate",
                        dtpContributionDate.Value.Date);

                    cmd.Parameters.AddWithValue(
                        "@Amount",
                        Convert.ToDecimal(txtAmount.Text));

                    if (string.IsNullOrWhiteSpace(txtRemarks.Text))
                    {
                        cmd.Parameters.AddWithValue(
                            "@Remarks",
                            DBNull.Value);
                    }
                    else
                    {
                        cmd.Parameters.AddWithValue(
                            "@Remarks",
                            txtRemarks.Text.Trim());
                    }

                    cmd.Parameters.AddWithValue(
                        "@ContributionID",
                        contributionID);

                    cmd.ExecuteNonQuery();
                }

                MessageBox.Show(
                    "Contribution updated successfully.",
                    "Success",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Information);

                DialogResult = DialogResult.OK;
                Close();
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

        private void btnCancel_Click(object sender, EventArgs e)
        {
            Close();
        }
    }
}