class SettingsController < ApplicationController
    before_action :authenticate_user!
    
    def show
        @user = current_user
    end
    def create
        if current_user.update(user_params)
            redirect_to listings_path, notice: "Your information was successfully updated"
        else
            flash.now[:alert] = "There was an error updating your information"
            render :show
        end
    end

    private
    def user_params
        params.permit(:first_name, :last_name, :address_1, :address_2, :city, :state, :zipcode, :country)
     end
end