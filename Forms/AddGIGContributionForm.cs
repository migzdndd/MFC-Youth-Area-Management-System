using System;
using System.Data.SQLite;
using System.Windows.Forms;
using MFC_Youth_Database.Database;

namespace MFC_Youth_Area_Management_System.Forms
{
    public partial class AddGIGContributionForm : Form
    {
        private readonly int memberID;
        public AddGIGContributionForm(int memberID)
        {
            InitializeComponent();

            this.memberID = memberID;

            dtpContributionDate.Value = DateTime.Today;
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

        private void AddGIGContributionForm_KeyDown(object sender, KeyEventArgs e)
        {
            // Enter = Save
            if (e.KeyCode == Keys.Enter)
            {
                btnSave.PerformClick();
                e.SuppressKeyPress = true;
            }

            // Esc = Cancel
            else if (e.KeyCode == Keys.Escape)
            {
                btnCancel.PerformClick();
                e.SuppressKeyPress = true;
            }
        }

        private void btnSave_Click(object sender, EventArgs e)
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
INSERT INTO GIGContribution
(
    MemberID,
    ContributionDate,
    Amount,
    Remarks
)
VALUES
(
    @MemberID,
    @ContributionDate,
    @Amount,
    @Remarks
);";

                    SQLiteCommand cmd =
                        new SQLiteCommand(query, conn);

                    cmd.Parameters.AddWithValue(
                        "@MemberID",
                        memberID);

                    cmd.Parameters.AddWithValue(
                        "@ContributionDate",
                        dtpContributionDate.Value.ToString("yyyy-MM-dd"));

                    cmd.Parameters.AddWithValue(
                        "@Amount",
                        decimal.Parse(txtAmount.Text));

                    cmd.Parameters.AddWithValue(
                        "@Remarks",
                        txtRemarks.Text.Trim());

                    cmd.ExecuteNonQuery();
                }

                MessageBox.Show(
                    "Contribution saved successfully.",
                    "Success",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Information);

                DialogResult = DialogResult.OK;

                Close();
            }
            catch (SQLiteException ex)
            {
                MessageBox.Show(
                    ex.Message,
                    "Database Error",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error);
            }
            catch (Exception ex)
            {
                MessageBox.Show(
                    ex.Message,
                    "Error",
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
